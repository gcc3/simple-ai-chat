import { authenticate } from 'utils/authUtils';
import { getUser, getUserStores } from 'utils/sqliteUtils';

export default async function (req, res) {
  try {
    // User stores
    let userStores = [];
    let stores = [];
    const authResult = authenticate(req);
    if (authResult.success) {
      const { id, username } = authResult.user;

      // Get user stores
      userStores.push(...await getUserStores(username));

      // Get group stores
      const user = await getUser(username);
      const groups = user.group.split(',');
      for (const group of groups) {
        if (!group || group === user.username) {
          continue;
        }

        const groupStores = await getUserStores(group);
        stores.push(...groupStores);
      }
    }

    // Output the result
    res.status(200).json({
      result: {
        user_stores: userStores,
        stores: stores,  // group stores
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
