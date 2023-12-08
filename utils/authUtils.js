import jwt from 'jsonwebtoken';

export const authenticate = (req) => {
  const token = req.cookies && req.cookies.auth;

  if (!token) { 
    return { 
      success: false,
      error: 'Please login.'
    };  // Token not provided
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { 
      success: true, 
      user: decoded
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Authentication decoed failed.'
     };
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

// Also use JWK to generate token for id, username, email, role
// Function to generate a token
export function encode(id, username, email, role) {
  // Create a payload with the id and username
  const payload = {
    id: id,
    username: username,
    email: email,
    role: role,
  };

  // Sign the token with the secret key
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expires in 1 hour
  });

  return token;
}

// Function to verify and decode the token
export function decode(token) {
  try {
    // Verify and decode the token with the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}