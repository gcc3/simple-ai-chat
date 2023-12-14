import { authenticate } from 'utils/authUtils';
import { getUserStores } from 'utils/sqliteUtils';

export default async function (req, res) {
  try {
    // User stores
    let userStores = [];
    const authResult = authenticate(req);
    if (authResult.success) {
      const { id, username } = authResult.user;

      // Get user stores
      userStores = await getUserStores(username);
    }

    // Output the result
    res.status(200).json({
      result: {
        user_stores: userStores,
        stores: [],  // default stores
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
