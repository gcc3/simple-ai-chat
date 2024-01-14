import { countInvites, getUser, getUserByCreatedAt, insertInvite, updateUserBalance } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';
import { decodeTimestamp } from 'utils/invitesUtils';
import { getRedirectableHtml } from 'utils/emailUtils';

export default async function (req, res) {
  const { code } = req.query;

  try {
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).send(getRedirectableHtml("Please login. To register a user, use the command \`:user add [username] [email] [password?]\`."));
      return;
    }

    // Check if userd invitation already
    const authUser = authResult.user;
    const user = await getUser(authUser.username);
    const invites = await countInvites(user.username);
    if (invites.count > 0) {
      res.status(403).send(getRedirectableHtml("You've already used the invitation."));
      return;
    }

    const createdAt = decodeTimestamp(code);
    const invitor = await getUserByCreatedAt(createdAt);
    if (!invitor && invitor.name === "__deleted__") {
      res.status(404).send(getRedirectableHtml("Invitation invalid."));
      return;
    }
    if (invitor.username === user.username) {
      res.status(403).send(getRedirectableHtml("You cannot invite yourself."));
      return;
    }

    // Update invites
    await insertInvite(user.username, code, invitor.username);

    // Update user balance
    await updateUserBalance(user.username, user.balance + 1);
    await updateUserBalance(invitor.username, invitor.balance + 1);

    // Output the result
    res.status(200).send(getRedirectableHtml("Accepted."));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
