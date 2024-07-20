import { getUser, userLeaveGroup } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils";

export default async (req, res) => {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).end();  // Method Not Allowed
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;

  // A group is actually a user
  const { group } = req.body;
  const groupName = group;

  // Validation
  if (!groupName) {
    return res.status(400).json({ 
      success: false,
      error: 'Group name is required.'
    });
  }

  // Check if the user is trying to leave their own group
  if (groupName === username) {
    return res.status(400).json({
      success: false,
      error: 'Cannot leave your own group.'
    });
  }

  // Get user
  const userGroup = await getUser(groupName);
  if (!userGroup) {
    return res.status(401).json({
      success: false,
      error: 'Group not found.'
    });
  }

  // Leave group
  await userLeaveGroup(username, groupName);
  res.status(200).json({ 
    success: true,
    message: 'Leaved.',
  });
};
