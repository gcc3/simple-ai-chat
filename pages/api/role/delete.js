import { getRole, deleteRole } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { roleName } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication failed.',
    });
  }
  const { id, username } = authResult.user;

  // Check role existance
  const role = await getRole(roleName, username);
  if (!role) {
    return res.status(200).json({ 
      success: false, 
      error: "Role not exists." 
    });
  }

  deleteRole(roleName, username);
  return res.status(200).json({ 
    success: true,
    message: "Role \"" + roleName + "\" is deleted.",
  });
}
