import { SES } from "@aws-sdk/client-ses";
import { getUser, updateUserPassword } from "utils/sqliteUtils";
import { generatePassword } from "utils/userUtils";

export default async function handler(req, res) {
  // Check method
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, email } = req.body;
  console.log('Password reset request for user "' + username + '"' + ', email "' + email + '".');

  // Check user info
  const user = await getUser(username);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: "User not found.",
    });
  } else {
    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        error: "Email not match.",
      });
    }
  }

  // Username and email match, reset password and send email
  const newPassword = generatePassword();
  await updateUserPassword(username, newPassword);

  // Send reset password to email
  const ses = new SES({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  const from = "support@simple-ai.io";
  const to = email;
  const subject = "Password reset";
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
          Data: 'Your new password has been reset to "' + newPassword + '". Please change it after login.',
        },
      },
    },
  };

  ses
    .sendEmail(emailParams)
    .then((data) => {
      res.status(200).json({
        success: true,
        message: "Your new password is sent to your email.",
        data,
      });
    })
    .catch((error) => {
      console.error(error, error.stack);
      res.status(500).json({
        success: false,
        error: "Failed to send email.",
      });
    });
}
