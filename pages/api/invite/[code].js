import { countInvites, getUser, getUserByCreatedAt, insertInvite, updateUserBalance } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';
import { decodeTimestamp } from 'utils/invitesUtils';

export default async function (req, res) {
  const { code } = req.query;

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
    const user = getUser(authUser.username);
    const invites = countInvites(user.username);
    if (invites > 0) {
      res.status(403).json({
        success: false,
        error: "You've already used invitation.",
      });
      return;
    }

    const createdAt = decodeTimestamp(code);
    const invitor = await getUserByCreatedAt(createdAt);
    if (!invitor && invitor.name === "__deleted__") {
      res.status(404).json({
        success: false,
        error: "Invitation invalid.",
      });
      return;
    }

    let add = 0;
    if (invitor.role !== "user") {
      add = 1;
    } else if (invitor.role === "pro_user") {
      add = 3;
    } else if (invitor.role === "super_user") {
      add = 5;
    }

    // Update invites
    insertInvite(user.username, invitor.username);

    // Update user balance
    updateUserBalance(user.name, user.balance + add);
    updateUserBalance(invitor.name, invitor.balance + add);

    // Output the result
    res.status(200).json({
      success: true,
      message: "Accepted.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
