import { authenticate } from 'utils/authUtils.js';
import { getUser, countChatsForUser, countTokenForUserByModel, countUserRoles } from 'utils/sqliteUtils.js';
import { createToken } from 'utils/authUtils.js';
import { getRoleFequencyLimit } from 'utils/usageUtils.js';
import { gpt4FeeCal, gpt4vFeeCal } from "utils/usageUtils";
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

    // Count token
    const tokenMonthlyUsageThisMonth = await getUserTokenUsageThisMonth(user.username, process.env.MODEL);
    const tokenMonthlyUsageLastMonth = await getUserTokenUsageLastMonth(user.username, process.env.MODEL);
    const tokenVMonthlyUsageThisMonth = await getUserTokenUsageThisMonth(user.username, process.env.MODEL_V);
    const tokenVMonthlyUsageLastMonth = await getUserTokenUsageLastMonth(user.username, process.env.MODEL_V);

    // Fee calculation
    const gpt4FeeThisMonth = gpt4FeeCal(tokenMonthlyUsageThisMonth.input, tokenMonthlyUsageThisMonth.output);
    const gpt4vFeeThisMonth = gpt4vFeeCal(tokenVMonthlyUsageThisMonth.input, tokenVMonthlyUsageThisMonth.output);
    const totalUsageFeeThisMonth = npre(gpt4FeeThisMonth + gpt4vFeeThisMonth);
    const gpt4FeeLastMonth = gpt4FeeCal(tokenMonthlyUsageLastMonth.input, tokenMonthlyUsageLastMonth.output);
    const gpt4vFeeLastMonth = gpt4vFeeCal(tokenVMonthlyUsageLastMonth.input, tokenVMonthlyUsageLastMonth.output);
    const totalUsageFeeLastMonth = npre(gpt4FeeLastMonth + gpt4vFeeLastMonth);

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
              this_month: tokenMonthlyUsageThisMonth,
              last_month: tokenMonthlyUsageLastMonth,
            },
            token_v: {
              this_month: tokenVMonthlyUsageThisMonth,
              last_month: tokenVMonthlyUsageLastMonth,
            }
          },
          use_count_fequencies: await getUseCountFequenciesWithLimit(user.username, user.role),
          use_count_monthly: {
            this_month: await getUseCountThisMonth(user.username),
            last_month: await getUseCountLastMonth(user.username),
          },
          gpt4_fee_last_month: gpt4FeeLastMonth,
          gpt4v_fee_last_month: gpt4vFeeLastMonth,
          total_usage_fees_last_month: totalUsageFeeLastMonth,
          gpt4_fee_this_month: gpt4FeeThisMonth,
          gpt4v_fee_this_month: gpt4vFeeThisMonth,
          total_usage_fees_this_month: totalUsageFeeThisMonth,
        },
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
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // Add 1 because getUTCMonth() returns 0-11
  return getUserTokenUsageByMonth(username, model, year, month);
}

async function getUserTokenUsageLastMonth(username, model) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
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
