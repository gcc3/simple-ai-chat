import jwt from 'jsonwebtoken';

export const authenticate = (req) => {
  const token = req.cookies && req.cookies.auth;

  // Token not provided
  if (!token) {
    // Try username and password auth
    if ((req.method === "POST" && req.body.username === "root" && req.body.password === process.env.ROOT_PASS) ||
        (req.method === "GET" && req.query.username === "root" && req.query.password === process.env.ROOT_PASS)) {
      return {
        success: true, 
        user: { username: "root" }
      };
    }

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
      error: 'Authentication decode failed.'
     };
  }
};

export const createToken = (payload, expireIn = '24h') => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expireIn });
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