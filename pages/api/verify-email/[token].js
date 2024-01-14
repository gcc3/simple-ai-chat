import { decode } from "utils/authUtils"
import { getUser, updateUserEmailVerifiedAt, updateUserStatus, updateUserIPAndLastLogin } from "utils/sqliteUtils"
import { createToken } from "utils/authUtils"
import { getUserByEmail } from "utils/sqliteUtils"
import { getRedirectableHtml } from "utils/emailUtils";

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

    return res.status(200).send(getRedirectableHtml("Email verified!"));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
