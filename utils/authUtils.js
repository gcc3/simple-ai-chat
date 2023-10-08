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
    return { success: false, error: 'Authentication decoed failed.' };
  }
};

export const createToken = (payload) => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    return token;
  } catch (error) {
    return null;
  }
}
