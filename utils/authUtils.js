import jwt from 'jsonwebtoken';

export const authenticate = (req, res) => {
  const token = req.cookies && req.cookies.auth;

  if (!token) { 
    return { success: false, error: 'Please login.' };  // Token not provided
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Authentication failed.' };  // Token not valid
  }
};
