import AWS from 'aws-sdk';
import { getUser } from 'utils/sqliteUtils';
import generate from '../generate';
import { generatePassword } from 'utils/userUtils';

export default async function handler(req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, email } = req.body;
  console.log("Password reset request: username = \"" + username 
  + "\"" + ", email = \"" + email + "\".");

  // Check user info
  const user = await getUser(username);
  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
  } else {
    if (user.email !== email) {
      return res.status(400).json({ success: false, message: 'Email not match' });
    }
  }

  // Username and Email match, send email
  // Configure AWS SES
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const ses = new AWS.SES();
  const from = 'support@simple-ai.io';
  const to = email;
  const subject = 'Password reset';
  try {
    const data = await ses.sendEmail({
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
            Data: "Your new password is reset to " + generatePassword(),
          },
        },
      },
    }).promise();
    res.status(200).json({ 
      success: true, 
      message: 'New password is sent to your email', 
      data 
    });
  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: err 
    });
  }
}
