import { verifiyEmailAddress } from "utils/emailUtils";
import { insertUser, getUser, emailExists } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";
import AWS from 'aws-sdk';

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
    return res.status(200).json({ 
        success: false, 
        message: "Username already used." 
      });
  }

  // Check if the email is valid.
  if (!verifiyEmailAddress(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email is invalid.'
    });
  }

  // Check if the email already exists in the database.
  const emailUser = await emailExists(email);
  if (emailUser) {
    return res.status(400).json({ error: 'Email already used by user \"' + emailUser.username + '\". If you lost password please reset with command \`:user reset pass [username] [email]\`' });
  }

  // Generate a jwt token
  const token = encode(username, email);

  // Email validation
  if (process.env.USE_EMAIL == "true") {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const ses = new AWS.SES();
    const from = 'support@simple-ai.io';
    const to = email;
    const subject = 'Welcome to simple-ai.io';
    const body = "Your account is created successfully." + (!password ? " Initial password is \"" + generatedPassword + "\", please change it after login." : "") 
               + `Please click the following link to verify your email: <a href="https://simple-ai.io/api/verify-email/${token}">https://simple-ai.io/api/verify-email/${token}</a>`;;
    const emailParams = {
      Source: 'Simple AI <' + from + '>',
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
      insertUser(username, "user", password ? password : generatedPassword, email, settings,         "", "active", new Date());

      res.status(200).json({ 
        success: true,
        username,
        message: "User \"" + username + "\"" + " is created." + (!password ? " Initial password is sent to your email." : ""),
        data,
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
    insertUser(username, "user", password ? password : generatedPassword, email, settings,         "", "active", new Date());

    // No error
    return res.status(200).json({ 
      success: true,
      username,
      message: "User \"" + username + "\" is created." + (!password ? " Initial password is \"" + generatedPassword + "\", please change it after login." : ""),
    });
  }
}
