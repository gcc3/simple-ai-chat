import { authenticate } from 'utils/authUtils';
import { getUser, getUserNodes } from 'utils/sqliteUtils';

export default async function(req, res) {
  try {
    // User nodes
    let userNodes = [];
    let groupNodes = [];
    let systemNodes = [];

    const authResult = authenticate(req);
    if (authResult.success) {
      const { id, username } = authResult.user;

      // Get user nodes
      userNodes.push(...await getUserNodes(username));

      // Get group nodes
      const user = await getUser(username);
      const groups = user.group.split(',');
      for (const group of groups) {
        if (!group || group === user.username) {
          continue;
        }
        groupNodes.push(...await getUserNodes(group));
      }

      // Get system nodes
      systemNodes.push(...await getUserNodes('root'));
    }

    // Output the result
    res.status(200).json({
      result: {
        user_nodes: userNodes,
        group_nodes: groupNodes,
        system_nodes: systemNodes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
