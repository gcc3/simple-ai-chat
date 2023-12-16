import { getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { countChatsForUser, countTokenForUserByModel } from 'utils/sqliteUtils.js';
import { createToken } from 'utils/authUtils.js';
import { getRoleFequencyLimit } from 'utils/usageUtils.js';
const moment = require('moment');

export default async function (req, res) {
  // Method Not Allowed if not GET
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  try {
    const user = await getUser(username);
    if (user) {
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
          settings: JSON.parse(user.settings),
          role: user.role,
          role_expires_at: user.role_expires_at,
          role_expires_at_h: (user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : "-"),
          usage: {
            token_fequencies: {
              token: await getUserTokenFequencies(user.username, process.env.MODEL),
              token_v: await getUserTokenFequencies(user.username, process.env.MODEL_V),
            },
            token_monthly: {
              token: {
                this_month: await getUserTokenUsageThisMonth(user.username, process.env.MODEL),
                last_month: await getUserTokenUsageLastMonth(user.username, process.env.MODEL),
              },
              token_v: {
                this_month: await getUserTokenUsageThisMonth(user.username, process.env.MODEL_V),
                last_month: await getUserTokenUsageLastMonth(user.username, process.env.MODEL_V),
              }
            },
            use_count_fequencies: await getUseCountFequenciesWithLimit(user.username, user.role),
            use_count_monthly: {
              this_month: await getUseCountThisMonth(user.username),
              last_month: await getUseCountLastMonth(user.username),
            }
          },
          usage_fees: JSON.parse(user.usage),
          balance: user.balance,
        }
      });
    } else {
      // Clear the auth token cookie
      res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);

      // Return user is removed when user not exist
      res.status(404).json({ 
        success: false,
        error: 'User not exists.'
      });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error,
    });
  }
}

// Use count
async function getUseCountThisMonth(username) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Add 1 because getMonth() returns 0-11
  return getUseCountByMonth(username, year, month);
}

async function getUseCountLastMonth(username) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return getUseCountByMonth(username, year, month);
}

async function getUseCountByMonth(username, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startTime = new Date(year, month - 1, 1).getTime();
  const endTime = new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime();
  return await countChatsForUser(username, startTime, endTime);
}

// Use count fequencies
async function getUseCountFequenciesWithLimit(username, role) {
  const daily = await countChatsForUser(username, Date.now() - 86400000, Date.now());
  const weekly = await countChatsForUser(username, Date.now() - 604800000, Date.now());
  const monthly = await countChatsForUser(username, Date.now() - 2592000000, Date.now());
  const { daily_limit, weekly_limit, monthly_limit } = getRoleFequencyLimit(role);

  let exceeded = false;
  if (daily_limit && daily >= daily_limit) {
    exceeded = true;
  }

  if (weekly_limit && weekly >= weekly_limit) {
    exceeded = true;
  }

  if (weekly_limit && monthly >= monthly_limit) {
    exceeded = true;
  }

  return {
    daily,
    daily_limit,
    weekly,
    weekly_limit,
    monthly,
    monthly_limit,
    exceeded,
  }
}

// Token
async function getUserTokenUsageThisMonth(username, model) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Add 1 because getMonth() returns 0-11
  return getUserTokenUsageByMonth(username, model, year, month);
}

async function getUserTokenUsageLastMonth(username, model) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return getUserTokenUsageByMonth(username, model, year, month);
}

async function getUserTokenUsageByMonth(username, model, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startTime = new Date(year, month - 1, 1).getTime();
  const endTime = new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime();
  return await countTokenForUserByModel(username, model, startTime, endTime);
}

// Token fequencies
async function getUserTokenFequencies(username, model) {
  const daily = await countTokenForUserByModel(username, model, Date.now() - 86400000, Date.now());
  const weekly = await countTokenForUserByModel(username, model, Date.now() - 604800000, Date.now());
  const monthly = await countTokenForUserByModel(username, model, Date.now() - 2592000000, Date.now());
  return {
    daily,
    weekly,
    monthly,
  }
}