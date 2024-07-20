import { authenticate } from 'utils/authUtils.js';
import { getUser, countUserRoles } from 'utils/sqliteUtils.js';
import { createToken } from 'utils/authUtils.js';
import { getAvailableStoresForUser } from 'utils/storeUtils';
import { getAvailableNodesForUser } from 'utils/nodeUtils';
import { npre } from "utils/numberUtils";

const moment = require('moment');

export default async function (req, res) {
  // Check method
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { username, password } = req.query;
  let user = null;

  // If no username and password, try auth with cookie
  // Authentication
  if (!username || !password) {
    const authResult = authenticate(req);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        error: authResult.error
      });
    }
    const authUser = authResult.user;
    user = await getUser(authUser.username);
  } else {
    user = await getUser(username);
    if (user && password && user.password !== password) {
      return res.status(401).json({ 
        success: false,
        error: 'Incorrect username or password.'
      });
    }
  }

  if (!user) {
    // Clear the auth token cookie
    res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);

    // Return user is removed when user not exist
    res.status(404).json({ 
      success: false,
      error: 'User not exists.'
    });
  }

  try {
    // Refresh user auth token
    // Create JWT token
    const payload = {
      id: user.id, 
      username: user.username,
      subscription: user.role,
      email: user.email,
    };
    const token = createToken(payload);
    if (!token) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create token.'
      });
    }

    // Set the token as a cookie
    const sameSiteCookie = process.env.SAME_SITE_COOKIE;
    res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/; Max-Age=86400; ${sameSiteCookie}`);

    res.status(200).json({ 
      user: {
        id: user.id,
        username: user.username,
        group: user.group,
        email: user.email,
        email_verified: user.email_verified_at ? true : false,
        email_subscription: user.email_subscription,
        settings: JSON.parse(user.settings),
        role: user.role,
        role_expires_at: user.role_expires_at,
        role_expires_at_h: (user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : "-"),
        balance: user.balance,
        user_role_count: (await countUserRoles(user.username)).count,
        store_count: (await getAvailableStoresForUser(user)).length,
        node_count: (await getAvailableNodesForUser(user)).length,
        created_at_h: moment.unix(user.created_at / 1000).format('MM/DD/YYYY'),
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}
