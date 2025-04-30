import { authenticate } from 'utils/authUtils';
import { getUser, getUserModels } from 'utils/sqliteUtils';

export default async function(req, res) {
  try {
    // User models
    let userModels = [];
    let groupModels = [];
    let systemModels = [];

    const authResult = authenticate(req);
    if (authResult.success) {
      const { id, username } = authResult.user;

      // Get user models
      userModels.push(...await getUserModels(username));

      // Get group models
      const user = await getUser(username);
      const groups = user.group.split(',');
      for (const group of groups) {
        if (!group || group === user.username) {
          continue;
        }
        groupModels.push(...await getUserModels(group));
      }

      // Get system models
      systemModels.push(...await getUserModels('root'));
    }

    // Output the result
    res.status(200).json({
      success: true,
      result: {
        user_models: userModels,
        group_models: groupModels,
        system_models: systemModels,
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
