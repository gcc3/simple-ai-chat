import { updateUserRole, getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import AWS from 'aws-sdk';

// TODO: add API key authentication
export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { role } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  try {
    // Check if the user exists
    const user = await getUser(username);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role === role && role === "super_user") {
      return res.status(400).json({ 
        success: false,
        message: 'User is already subscribed.',
      });
    }

    if (user.role === role && role === "user") {
      return res.status(400).json({ 
        success: false,
        message: 'User is already unsubscribed.',
      });
    }

    const wasSuccessful = await updateUserRole(username, role);
    if (wasSuccessful) {
      if (process.env.USE_EMAIL === "false") {
        return res.status(200).json({ 
          success: true, 
          message: 'Subscription updated.', 
        });
      }

      // Send email to user
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });

      const ses = new AWS.SES();
      const from = 'support@simple-ai.io';
      const to = user.email;
      const subject = "Super User Subscription";
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
              Data: "You have subscribed to `simple-ai.io` and become a `super_user`.",
            },
          },
        },
      };
    
      ses.sendEmail(emailParams).promise()
        .then((data) => {
          return res.status(200).json({ 
            success: true, 
            message: 'Subscription updated, an email is sent to user.', 
            data 
          });
        }).catch((err) => {
          console.error(err, err.stack);
          return res.status(500).json({ 
            success: false, 
            message: 'Subscription updated, failed to send email to user.', 
            error: err
          });
        });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to update subscription.',
       });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error occurred while updating the user subscription.'
    });
  }
}
