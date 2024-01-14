import { getRolePrompt } from 'utils/roleUtils';
import { getRole } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';

export default async function (req, res) {
  const { roleName } = req.query;

  try {
    const authResult = authenticate(req);
    if (authResult.success) {
      // Check if role exists in user roles
      const userRole = await getRole(roleName, authResult.user.username);
      if (userRole) {
        return res.status(200).json({ 
          result: {
            role: userRole.role,
            prompt: userRole.prompt
          },
        });
      }
    }

    // Output the result
    res.status(200).json({
      success: true,
      result: {
        role: roleName,
        prompt: await getRolePrompt(roleName)
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
