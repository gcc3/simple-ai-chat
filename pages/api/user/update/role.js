import { updateUserRole, extendUserRole, getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { SES } from '@aws-sdk/client-ses';
import moment from 'moment';


// TODO: add API key authentication
export default async function (req, res) {
  // Check method
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
        error: 'User not found.',
      });
    }

    // Extend user role
    let wasSuccessful = false;
    if (user.role === role) {
      // Extend user role
      // Allow user to extend even the role not expired yet
      const extendTo = Math.max(moment().add(1, 'M').valueOf(), moment(user.role_expires_at).add(1, 'M').valueOf());
      wasSuccessful = await extendUserRole(username, extendTo);
    } else {
      // Update user role
      wasSuccessful = await updateUserRole(username, role);

      // Extend user role
      const extendTo = moment().add(1, 'M').valueOf();
      wasSuccessful = await extendUserRole(username, extendTo);
    }

    if (wasSuccessful) {
      if (process.env.USE_EMAIL === "false" || user.email === "") {
        return res.status(200).json({
          success: true,
          message: 'Role updated.',
        });
      }

      // Send email to user
      const ses = new SES({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      const from = 'support@simple-ai.io';
      const to = user.email;
      const subject = "Role Update";
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
              Data: "Your user role is updated.",
            },
          },
        },
      };

      ses.sendEmail(emailParams)
        .then((data) => {
          return res.status(200).json({
            success: true,
            message: 'Role updated, an email is sent to user.',
            data
          });
        }).catch((error) => {
          console.error(error, error.stack);
          return res.status(500).json({
            success: false,
            error: "Role updated, failed to send email to user.",
          });
        });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Failed to update user role, please contact support.',
       });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error occurred while updating the user role, please contact support.'
    });
  }
}
