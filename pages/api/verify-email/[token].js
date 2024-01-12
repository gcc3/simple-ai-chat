import { decode } from "utils/authUtils"
import { getUser, updateUserEmailVerifiedAt, updateUserStatus, updateUserIPAndLastLogin } from "utils/sqliteUtils"
import { createToken } from "utils/authUtils"
import { getUserByEmail } from "utils/sqliteUtils"

export default async function (req, res) {
  // Check if the method is GET
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  // The verification token
  const { token } = req.query;

  try {
    const data = decode(token);
    if (!data) {
      return res.status(400).send("Verification failed.");
    }

    // Get user
    const user = await getUser(data.username);
    if (!user) {
      return res.status(400).send("User not found.");
    }

    if (user.email !== data.email) {
      return res.status(400).send("Email error.");
    }

    const sameEmailUser = await getUserByEmail(data.email);
    if (sameEmailUser && sameEmailUser.username !== data.username) {
      return res.status(400).send("Email address conflict.");
    }

    // Update email verified at
    await updateUserEmailVerifiedAt(data.username);

    // Update user status
    await updateUserStatus(user.username, 'active');

    // Update user last login
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const browser = req.headers['user-agent'];
    await updateUserIPAndLastLogin(user.username, ip, "T=" + (new Date()) + " IP=" + ip + " BSR=" + browser);

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="3;url=/" />
        <title>simple ai - chat</title>
        <link rel="stylesheet" href="https://code.cdn.mozilla.net/fonts/fira.css">
        <style>
          body { 
            font-size: 16px;
            font-family: "Fira Mono", "Fira Code VF", "ColfaxAI", Helvetica, sans-serif;
          }
        </style>
      </head>
      <body>
        Email verified!<br />
        Redirecting in 3 seconds...
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
      
      <title>simple ai - chat</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
        .message { font-size: 1.5em; }
      </style>
      </head>
      <body>
      <div class="message">
        <h1>Email Successfully Verified!</h1>
        <p>Redirecting to the homepage...</p>
      </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
