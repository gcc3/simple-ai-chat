import { getUserByEmail, updateUserEmailSubscription } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import AWS from 'aws-sdk';

export default async function (req, res) {
  // Check method
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { email, email_subscription } = req.query;

  // Input and validation
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      error: '`email` is required.'
    });
  }

  if (!email_subscription) {
    return res.status(400).json({ 
      success: false, 
      error: '`email_subscription` is required.'
    });
  }

  // Check if the email already exists in the database.
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: "User not found.",
    });
  }

  // Update email subscription
  await updateUserEmailSubscription(email, email_subscription);

  if (email_subscription == "1") {
    if (process.env.USE_EMAIL == "true") {
      // Send update email
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });

      const ses = new AWS.SES();
      const from = 'support@simple-ai.io';
      const to = email;
      const subject = 'Email verification';
      const body = 'You\'re subscribed.';
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
            success: true,
            error: "Failed to send email, however you're subscribed.",
          });
        });
    } else {
      res.status(200).json({ 
        success: true,
        message: 'You\'re subscribed.'
      });
    }
  } else {
    res.status(200).json({ 
      success: true,
      message: 'You\'re unsubscribed.'
    });
  }
}
