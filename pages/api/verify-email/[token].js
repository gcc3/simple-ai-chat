import { decode } from "utils/authUtils"
import { getUser, updateUserEmailVerifiedAt, updateUserIPAndLastLogin, updateUserEmail } from "utils/sqliteUtils"
import { getUserByEmail } from "utils/sqliteUtils"
import { getRedirectableHtml } from "utils/emailUtils";

export default async function (req, res) {
  // Check method
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  // The verification token
  const { token } = req.query;

  try {
    const data = decode(token);
    if (!data) {
      return res.status(400).send(getRedirectableHtml("Verification failed."));
    }

    // Get user
    const user = await getUser(data.username);
    if (!user) {
      return res.status(400).send(getRedirectableHtml("User not found."));
    }

    if (user.email !== data.email) {
      console.log("User `" + user.username + "` is setting email from `" + user.email + "` to `" + data.email + "`.");

      // Update user email
      await updateUserEmail(data.username, data.email);
    }

    const sameEmailUser = await getUserByEmail(data.email);
    if (sameEmailUser && sameEmailUser.username !== data.username) {
      return res.status(400).send(getRedirectableHtml("Email address conflict."));
    }

    // Update email verified at
    await updateUserEmailVerifiedAt(data.username);

    // Update user last login
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const browser = req.headers['user-agent'];
    await updateUserIPAndLastLogin(user.username, ip, "T=" + (new Date()) + " IP=" + ip + " BSR=" + browser);

    return res.status(200).send(getRedirectableHtml("Email verified!"));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
