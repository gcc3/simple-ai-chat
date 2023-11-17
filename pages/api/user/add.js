import { verifiyEmailAddress } from "utils/emailUtils";
import { insertUser, getUser, emailExists } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";
import AWS from 'aws-sdk';

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, email, settings } = req.body;
  const password = generatePassword();

  // Username validation
  if (!username) {
    return res.status(400).json({ error: "User name is required." });
  }

  // Check user existance
  const user = await getUser(username);
  if (user) {
    return res.status(200).json({ 
        success: false, 
        message: "Username already used." 
      });
  }

  // Email validation
  if (email) {
    // Check if the email is valid.
    if (!verifiyEmailAddress(email)) {
      return res.status(400).json({ error: 'Email is invalid.' });
    }
    
    // Check if the email already exists in the database.
    const emailUser = await emailExists(email);
    if (emailUser) {
      return res.status(400).json({ error: 'Email already used by user \"' + emailUser.username + '\".' });
    }

    // Send password to email
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const ses = new AWS.SES();
    const from = 'support@simple-ai.io';
    const to = email;
    const subject = 'Password reset';
    const body = "Your initial password is \"" + password + "\", you can change it after login.";
    const emailParams = {
      Source: from,
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

    ses.sendEmail(emailParams).promise()
    .then((data) => {
      insertUser(username, password, "user", email, settings,         "", "active", new Date());
              // username, password,   role, email, settings, last_login,   status, created_at

      res.status(200).json({ 
        success: true,
        username,
        password,
        message: "User \"" + username + "\"" + " is created, initial password is sent to your email. You can change if after login with command \`:user set pass [password]\`.",
        data
      });
    }).catch((err) => {
      console.error(err, err.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email.', 
        error: err 
      });
    });
  } else {
    // No email provided, send password to console
    insertUser(username, password, "user",    "", settings,         "", "active", new Date());
            // username, password,   role, email, settings, last_login,   status, created_at

    // No error
    return res.status(200).json({ 
      success: true,
      username,
      password,
      message: "User \"" + username + "\" is created with initial password \"" + password + "\". You can change it after login with command \`:user set pass [password]\`.",
    });
  }
}
