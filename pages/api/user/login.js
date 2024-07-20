import { getUser, updateUserIPAndLastLogin, updateUserStatus } from "utils/sqliteUtils.js";
import { createToken } from "utils/authUtils.js";

export default async (req, res) => {
  // Check method.
  if (req.method !== 'POST') {
    return res.status(405).end();  // Method Not Allowed
  }

  const { username, password, expiresIn } = req.body;
  console.log("User logging in system. username: " + username 
            + ", password: " + password + ", expireIn: " + expiresIn);

  // Validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  // Get user
  const user = await getUser(username);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.'
    });
  }

  // Check password
  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password.'
    });
  }

  // Check user status
  if (user.status === 'suspend') {
    return res.status(401).json({
      success: false,
      error: 'Your account is being suspended. Please contact support at `support@simple-ai.io` for help.'
    });
  }

  // Check email verified or not
  if (user.email_verified_at === null) {
    return res.status(401).json({
      success: false,
      error: 'Please verify your email. To re-send verification email, login and use the command \`:user set email [email]\`."
    });
  }

  // Create JWT token
  const payload = { 
    id: user.id, 
    username: user.username,
    role: user.role,
    email: user.email,
  };

  const token = createToken(payload);
  if (!token) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create token.'
    });
  }

  // Update user status
  await updateUserStatus(user.username, 'active');

  // Update user last login
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];
  await updateUserIPAndLastLogin(user.username, ip, "T=" + (new Date()) + " IP=" + ip + " BSR=" + browser);

  // Set the token as a cookie
  const sameSiteCookie = process.env.SAME_SITE_COOKIE;
  res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/; Max-Age=86400; ${sameSiteCookie}`);
  
  res.status(200).json({ 
    success: true,
    message: 'Login successful.',
    user: { 
      username: user.username, 
      role: user.role,
      email: user.email, 
      settings: JSON.parse(user.settings),
    } 
  });
};
