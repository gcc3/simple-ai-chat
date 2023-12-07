import { roleListing } from 'utils/roleUtils';
import { authenticate } from 'utils/authUtils';
import { getUserRoles } from 'utils/sqliteUtils';

export default async function (req, res) {
  try {
    const roles = await roleListing();

    // Custom roles
    let userRoles = [];
    const authResult = authenticate(req);
    if (authResult.success) {
      const { id, username } = authResult.user;

      // Get user custom roles
      userRoles = await getUserRoles(username);
    }

    // Output the result
    res.status(200).json({
      result: {
        roles : roles,
        user_roles: userRoles
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
