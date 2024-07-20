import { getUserByName, updateUserEmailSubscription } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import AWS from 'aws-sdk';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email_subscription } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: authResult.error
    });
  }
  const { id, username, role } = authResult.user;
  console.log('Set `email_subscription` request for user `' + username + '`' + ', email_subscription `' + email_subscription + '`.');

  // Input and validation
  if (!email_subscription) {
    return res.status(400).json({ 
      success: false, 
      error: '`email_subscription` is required.'
    });
  }

  // Check if the email already exists in the database.
  const user = await getUserByName(username);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: "User not found.",
    });
  }

  // Update email subscription
  await updateUserEmailSubscription(username, email_subscription);

  // Email is valid, verify the email.
  // Send update email
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  if (email_subscription == "1") {
    const ses = new AWS.SES();
    const from = 'support@simple-ai.io';
    const to = user.email;
    const subject = 'Email verification';
    const body = 'Your email subscription is updated.';
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
          message: 'You\'re subscribed.',
          data
        });
      }).catch((err) => {
        console.error(err, err.stack);
        res.status(500).json({
          success: false,
          error: "Failed to send email, however you're subscribed.",
        });
      });
  } else {
    res.status(200).json({ 
      success: true,
      message: 'You\'re unsubscribed.'
    });
  }
}
