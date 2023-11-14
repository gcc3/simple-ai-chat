import { updateUserEmail, emailExists } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { verifiyEmailAddress } from 'utils/emailUtils.js';
import AWS from 'aws-sdk';
import generate from 'pages/api/generate';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { email } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed.',
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Generate a jwt token contains id, username, and email
  const jwtToken = generate(id, username, email);

  // Input and validation
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required.'
    });
  }

  if (!verifiyEmailAddress(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is invalid.'
    });
  }

  // Check if the email already exists in the database.
  const emailUser = await emailExists(email);
  if (emailUser) {
    return res.status(400).json({ 
      success: false,
      message: 'Email already used by another user.',
    });
  }

  // Email is valid, verify the email.
  // Send verification email
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const ses = new AWS.SES();
  const from = 'support@simple-ai.io';
  const to = email;
  const subject = 'Email verification';
  const body = `Please click the following link to verify your email: <a href="https://simple-ai.io/${jwtToken}">https://simple-ai.io/${jwtToken}</a>`;
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
      res.status(200).json({ 
        success: true,
        message: 'Verification email sent, please check your inbox.', 
        data 
      });
    }).catch((err) => {
      console.error(err, err.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email', 
        error: err 
      });
    });
}
