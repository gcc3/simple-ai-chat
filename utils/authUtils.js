import jwt from 'jsonwebtoken';

export const authenticate = (req) => {
  const token = req.cookies && req.cookies.auth;

  // Token not provided
  if (!token) { 
    return { 
      success: false,
      error: 'Please login.'
    };
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

// Also can use JWK to generate token for username, email
// Generate a token
export function encode(username, email, expiresIn = null) {
  // Create a payload with the id and username
  const payload = {
    username: username,
    email: email,
  };

  // No expiration
  if (!expiresIn) {
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
  }

  // Sign the token with the secret key
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,  // by default 1h
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