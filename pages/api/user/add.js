import { evalEmailAddress } from "utils/emailUtils";
import { insertUser, getUser, getUserByEmail, updateUsername } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";
import AWS from "aws-sdk";
import { encode } from "utils/authUtils";
const moment = require("moment");

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  let generatedPassword = "";
  const { username, email, password, settings } = req.body;
  if (!password) {
    generatedPassword = generatePassword();
  }

  // Check user existance
  const user = await getUser(username);
  if (user) {
    return res.status(400).json({
      success: false,
      error: "Username already used.",
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

  // Generate a jwt token
  const token = encode(username, email);

  // New user info
  const role = "user";
  const role_expires_at = moment().add(7, "days").valueOf();  // 7 days trial
  const balance = 5;  // $5 for trial
  const password_ = password ? password : generatedPassword;

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
    const body =
      "Your account is created successfully." +
      (!password ? ' Initial password is "' + generatedPassword + '", please change it after login.' : "") +
      "<br><br>" +
      `Please click the following link to verify your email: <a href="https://simple-ai.io/api/verify-email/${token}">https://simple-ai.io/api/verify-email/${token}</a>`;
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

    ses
      .sendEmail(emailParams)
      .promise()
      .then((data) => {
        let message = "";
        if (userResume) {
          updateUsername(username, email, password_);
          message = "Welcome back! we've resumed your subscription status." + (!password ? " Initial password is sent to your email." : "");
        } else {
          insertUser(username, role, role_expires_at, password_, email, balance, settings);
          message = 'User "' + username + '"' + " is created." + (!password ? " Initial password is sent to your email." : "") + " Please login with command `:login " + username + " [password]`.";
        }

        res.status(200).json({
          success: true,
          username,
          message,
          data,
        });
      })
      .catch((err) => {
        console.error(err, err.stack);
        res.status(500).json({
          success: false,
          message: "Failed to send email.",
          error: err,
        });
      });
  } else {
    let message = "";
    if (userResume) {
      updateUsername(username, email, password_);
      message = "Welcome back! we've resumed your subscription status." + (!password ? ' Initial password is "' + generatedPassword + '", please change it after login.' : "");
    } else {
      // No email provided, send password to console
      insertUser(username, role, role_expires_at, password_, email, balance, settings);
      message = 'User "' + username + '"' + " is created." + (!password ? ' Initial password is "' + generatedPassword + '", please change it after login.' : "") + " Please login with command `:login " + username + " [password]`.";
    }

    // No error
    return res.status(200).json({
      success: true,
      username,
      message,
    });
  }
}
