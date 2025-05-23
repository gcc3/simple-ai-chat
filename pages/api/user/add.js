import { evalEmailAddress } from "utils/emailUtils";
import { insertUser, getUser, getUserByEmail, updateUsername, countUserByIP } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";
import { SES } from "@aws-sdk/client-ses";
import { encode } from "utils/authUtils";
import { passwordCheck } from "utils/passwordUtils"
import { generateInviteCode } from "utils/invitesUtils";

export default async function (req, res) {
  // Check method
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const use_access_control = process.env.USE_ACCESS_CONTROL == "true" ? true : false;
  const use_email = process.env.USE_EMAIL == "true" ? true : false;

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

  // User access control
  if (use_access_control) {
    // Check if the IP alread used for another user
    if (!ip.includes("127.0.0.1")) {
      const countUserWithSameIP = await countUserByIP(ip);
      if (countUserWithSameIP >= 1) {
        console.log("IP address has been used too frequently for `user add`. IP:", ip);
        return res.status(400).json({
          success: false,
          error: "Your IP address has been used too frequently. For assistance, please contact our support at `support@simple-ai.io`.",
        });
      }
    }
  }

  // Generate a jwt token
  const token = encode(username, email);

  // New user info
  const role = "user";
  const role_expires_at = null;  // for `user` there is no expiration
  const balance = 1;  // for trial
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

  // Email validation
  if (use_email) {
    const ses = new SES({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    const from = "support@simple-ai.io";
    const to = email;
    const subject = "Welcome to simple-ai.io";
    const body
    = "Hi, " + username + "," + "<br>"
    + "<br>"
    + "Welcome to Simple AI!" + " " + "Your account has been created successfully." + (!password ? " " + "Initial password is " + generatedPassword + ", you can change it after login." : "") + "<br>"
    + "<br>"
    + `Use the following link to verify your email before using our services.` + "<br>"
    + `<a href="https://simple-ai.io/api/verify-email/${token}">https://simple-ai.io/api/verify-email/${token}</a>` + "<br>"
    + "<br>"
    + "Quick Start:" + "<br>"
    + "1. You can log in with command `:login [username] [password]` (no brackets needed), e.g `:login jack ********`" + "<br>"
    + "2. To check the Documentation, Usage, or change Settings, click the little dot at the screen corner." + "<br>"
    + "3. Use TAB key to auto complete the placeholder text." + "<br>"
    + "<br>"
    + "Thank you, enjoy." + "<br>"
    + "<br>"
    + "- Simple AI"
    + "<br>";

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
      message = "Welcome back! We've resumed your subscription status." + passwordGuide;
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
