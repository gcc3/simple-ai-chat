import AWS from "aws-sdk";
import { SES } from "@aws-sdk/client-ses";
import { getUser, getUserByEmail } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';
import { generateInviteCode } from 'utils/invitesUtils';

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
    const invitor = await getUser(authUser.username);
    const code = generateInviteCode(invitor);

    // Try find user
    const user = await getUserByEmail(email);
    if (user) {
      res.status(404).json({
        success: false,
        error: "User already joined.",
      });
      return;
    }

    // Send invitation email
    // JS SDK v3 does not support global configuration.
    // Codemod has attempted to pass values to each service client in this file.
    // You may need to update clients outside of this file, if they use global config.
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const ses = new SES({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },

      region: process.env.AWS_REGION,
    });
    const from = "support@simple-ai.io";
    const to = email;
    const subject = "Simple AI: Invitation";
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
            Data: `Hi, this is Simple AI.<br>`
                + `You have been invited by user \`${invitor.username}\` to join our AI platform.<br>`
                + `<br>`
                + `Please access it by clicking this link: <a href="https://simple-ai.io">https://simple-ai.io</a>.<br>`
                + `<br>`
                + `Register as a user and then use the following link to complete your invitation. You can get an 100k token usage for free.<br>`
                + `Invitation link: ${process.env.NEXT_PUBLIC_BASE_URL}/api/invite/complete/${code}` + `<br>`
                + `<br>`
                + `- Simple AI Developers`
          },
        },
      },
    };

    ses
      .sendEmail(emailParams)
      .then((data) => {
        res.status(200).json({
          success: true,
          message: "Invitation email sent.",
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
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
