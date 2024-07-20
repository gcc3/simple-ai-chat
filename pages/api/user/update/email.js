import { getUserByEmail } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { verifiyEmailAddress, evalEmailAddress } from 'utils/emailUtils.js';
import AWS from 'aws-sdk';
import { encode } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: authResult.error
    });
  }
  const { id, username, role } = authResult.user;
  console.log('Set `email` request for user `' + username + '`' + ', email `' + email + '`.');

  // Input and validation
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      error: '`email` is required.'
    });
  }

  // Check if the email is valid.
  if (!verifiyEmailAddress(email)) {
    return res.status(400).json({
      success: false,
      error: "`email` is invalid.",
    });
  }

  // Check if the email already exists in the database.
  const emailUser = await getUserByEmail(email);
  if (emailUser && emailUser.username !== username) {
    console.log("Email address conflict, already used by `" + emailUser.username + "`.");
    return res.status(400).json({ 
      success: false,
      error: 'Email already used by another user.',
    });
  }

  // Evaluate email address
  const evalResult = await evalEmailAddress(email);
  if (!evalResult.success) {
    return res.status(400).json({
      success: false,
      error: evalResult.error,
    });
  }

  // Generate a jwt token contains username, email
  const token = encode(username, email);

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
  const body = `Please click the following link to verify your email: <a href="https://simple-ai.io/api/verify-email/${token}">https://simple-ai.io/api/verify-email/${token}</a>`;
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
      res.status(200).json({ 
        success: true,
        message: 'Verification email sent, please check your inbox.',
        data
      });
    }).catch((err) => {
      console.error(err, err.stack);
      res.status(500).json({
        success: false,
        error: "Failed to send email.",
      });
    });
}
