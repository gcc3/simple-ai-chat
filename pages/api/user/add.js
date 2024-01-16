import { evalEmailAddress } from "utils/emailUtils";
import { insertUser, getUser, getUserByEmail, updateUsername, countUserByIP } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";
import AWS from "aws-sdk";
import { encode } from "utils/authUtils";
import { passwordCheck } from "utils/passwordUtils"
import { generateInviteCode } from "utils/invitesUtils";
const moment = require("moment");

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, email, password, settings } = req.body;

  let generatedPassword = "";
  if (!password) {
    generatedPassword = generatePassword();
  } else {
    // Check password
    const passwordCheckResult = passwordCheck(password);
    if (!passwordCheckResult.success) {
      return res.status(400).json({
        success: false,
        error: passwordCheckResult.error,
      });
    }
  }

  // Check user existance
  const user = await getUser(username);
  if (user) {
    return res.status(400).json({
      success: false,
      error: "Username already used.",
    });
  }

  // Check if the username adheres to Unix naming conventions
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
    return res.status(400).json({
      success: false,
      error: "Invalid username.",
    });
  }

  // Check if the email already exists in the database.
  let userResume = false;
  const sameEmailUser = await getUserByEmail(email);
  if (sameEmailUser && sameEmailUser.username !== username) {
    if (sameEmailUser.username === "__deleted__") {
      // Resume the deleted user
      userResume = true;
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Email already used by another user.',
      });
    }
  }

  // Evaluate email address
  if (!userResume) {
    const evalResult = await evalEmailAddress(email);
    if (!evalResult.success) {
      return res.status(400).json({
        success: false,
        error: evalResult.error,
      });
    }
  }

  // Check if the IP alread used for another user
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const countUserWithSameIP = await countUserByIP(ip);
  if (countUserWithSameIP >= 1) {
    return res.status(400).json({
      success: false,
      error: "Your IP address has been used too frequently. For assistance, please contact our support at `support@simple-ai.io`.",
    });
  }

  // Generate a jwt token
  const token = encode(username, email);

  // New user info
  const role = "user";
  const role_expires_at = null;  // for `user` there is no expiration
  const balance = 0.3;  // for trial
  const password_ = password ? password : generatedPassword;
  const loginComamndGuide = " You can login with command: `:login [username] [password]`.";

  // Insert new user
  if (userResume) {
    // Resume the deleted user
    await updateUsername(username, email, password_);
  } else {
    await insertUser(username, role, role_expires_at, password_, email, balance, settings);
  }

  // Get new user
  const newUser = await getUser(username);
  if (!newUser) {
    return res.status(500).json({
      success: false,
      error: "Failed to create user.",
    });
  }

  // Generate invite code
  const inviteCode = generateInviteCode(newUser);

  // Email validation
  if (process.env.USE_EMAIL == "true") {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const ses = new AWS.SES();
    const from = "support@simple-ai.io";
    const to = email;
    const subject = "Welcome to simple-ai.io";
    const body = "Thank you for joining Simple AI!" + "<br>"
               + "<br>"
               + `Your account, username is \"${username}\", has been created successfully.` + (!password ? ' Initial password is "' + generatedPassword + '", please change it after login.' : "") + "<br>"
               + "Please log in with command `:login [username] [password]` (no need brackets, e.g :login simpleUser1 ********)" + "<br>"
               + "<br>"
               + `Please click the following link to verify your email before using our services.` + "<br>" 
               + `<a href="https://simple-ai.io/api/verify-email/${token}">https://simple-ai.io/api/verify-email/${token}</a>` + "<br>"
               + "<br>"
               + `Quick Start Guide: https://youtu.be/${process.env.NEXT_PUBLIC_VIDEO_ID}` + "<br>"
               + "For support, email us at `support@simple-ai.io`." + "<br>"
               + `Join our discord server to get the latest news and updates: https://discord.gg/${process.env.NEXT_PUBLIC_DISCORD}` + "<br>"
               + "<br>"
               + "Share Simple AI with friends and earn 100K tokens rewards per invite!" + "<br>"
               + "Invite friend to joined and click the invitation link below will grant 100K tokens usage to both of you." + "<br>"
               + `Invitation Link: https://simple-ai.io/api/invite/complete/${inviteCode}` + "<br>"
               + "<br>"
               + "* Please do not register multiple accounts or use temporary email addresses, as it will result in your account being banned." + "<br>"
               + "<br>"
               + "- Simple AI Developers";
    
    const emailParams = {
      Source: "Simple AI <" + from + ">",
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: body,
          },
        },
      },
    };

    let passwordGuide = !password ? " Initial password is sent to your email." : "";
    ses
      .sendEmail(emailParams)
      .promise()
      .then((data) => {
        let message = "";
        if (userResume) {
          message = "Welcome back! we've resumed your subscription status." + passwordGuide;
        } else {
          message = "User \"" + username + "\" is created." + passwordGuide + loginComamndGuide + " Please check your email for verification.";
        }

        res.status(200).json({
          success: true,
          username,
          message,
          data,
        });
      })
      .catch((error) => {
        console.error(error, error.stack);
        res.status(500).json({
          success: false,
          error: error,
        });
      });
  } else {
    // No email validation
    let message = "";
    let passwordGuide = !password ? ' Initial password is "' + generatedPassword + '", please change it after login.' : "";
    if (userResume) {
      message = "Welcome back! we've resumed your subscription status." + passwordGuide;
    } else {
      // No email provided, send password to console
      message = "User \"" + username + "\" is created." + passwordGuide + loginComamndGuide;
    }

    // No error
    return res.status(200).json({
      success: true,
      username,
      message,
    });
  }
}
