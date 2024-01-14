import AWS from "aws-sdk";
import { getUser } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';
import { encodeTimestamp } from 'utils/invitesUtils';

export default async function (req, res) {
  const { email } = req.query;

  try {
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).json({
        success: false,
        error: authResult.error,
      });
      return;
    }

    // Check if userd invitation already
    const authUser = authResult.user;
    const invitor = getUser(authUser.username);
    const code = encodeTimestamp(invitor.created_at);

    // Send invitation email
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const ses = new AWS.SES();
    const from = "support@simple-ai.io";
    const to = email;
    const subject = "Simple AI Invitation";
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
            Data: `You are invited by \`${user.username}\` to join Simple AI (simple-ai.io). Your invitation code: \`${code}\` ($1).`,
          },
        },
      },
    };

    ses
      .sendEmail(emailParams)
      .promise()
      .then((data) => {
        res.status(200).json({
          success: true,
          message: "Invitation email is sent.",
          data,
        });
      })
      .catch((error) => {
        console.error(error, error.stack);
        res.status(500).json({
          success: false,
          error: "Failed to send email",
        });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
