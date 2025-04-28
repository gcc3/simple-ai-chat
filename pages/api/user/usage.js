import { authenticate } from 'utils/authUtils.js';
import { getUser, countChatsForUser, countTokenForUserByModel, getUsageModelsForUser } from 'utils/sqliteUtils.js';
import { createToken } from 'utils/authUtils.js';
import { getRoleFequencyLimit } from 'utils/usageUtils.js';
import { feeCal } from "utils/usageUtils";
import { npre } from "utils/numberUtils";
import { getModelName } from "utils/llmUtils";

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

    // Get usage models
    const usageModelObjs = await getUsageModels(user.username);
    let modelUsageList = [];

    // Loop through usage models
    let totalUsageFeeThisMonth = 0;
    let totalUsageFeeLastMonth = 0;
    for (const modelObj of usageModelObjs) {
      const model = modelObj.model;

      // Count token
      const tokenUsageThisMonth = await getModelTokenUsageThisMonth(user.username, model);
      const tokenUsageLastMonth = await getModelTokenUsageLastMonth(user.username, model);

      // Fee calculation
      const feeThisMonth = feeCal(model, tokenUsageThisMonth.input, tokenUsageThisMonth.output);
      const feeLastMonth = feeCal(model, tokenUsageLastMonth.input, tokenUsageLastMonth.output);

      // Token frequencies
      const tokenFrequencies = await getModelTokenFrequencies(user.username, model);

      // Append to model usage
      modelUsageList.push({
        model: getModelName(model),
        token: {
          this_month: tokenUsageThisMonth,
          last_month: tokenUsageLastMonth,
        },
        fee: {
          this_month: npre(feeThisMonth),
          last_month: npre(feeLastMonth),
        },
        token_frequencies: tokenFrequencies,
      });

      // Add to total
      totalUsageFeeThisMonth += feeThisMonth;
      totalUsageFeeLastMonth += feeLastMonth;
    }

    // Set the token as a cookie
    const sameSiteCookie = process.env.SAME_SITE_COOKIE;
    res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/; Max-Age=86400; ${sameSiteCookie}`);
    res.status(200).json({
      usage: {
        // Use count
        use_count_monthly: {
          this_month: await getUseCountThisMonth(user.username),
          last_month: await getUseCountLastMonth(user.username),
        },
        // Model usage
        model_usage: modelUsageList,
        // Frequencies
        // Daily usage, weekly usage, monthly usage
        // This will display bar charts
        use_count_frequencies: await getUseCountFrequenciesWithLimit(user.username, user.role),
        // Total usage fee
        total_usage_fee_this_month: totalUsageFeeThisMonth,
        total_usage_fee_last_month: totalUsageFeeLastMonth,
      },
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

// Use count frequencies
async function getUseCountFrequenciesWithLimit(username, role) {
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

// Usage models (last month first day ~ now)
async function getUsageModels(username) {
  // Now
  const now = new Date();

  // Clock (last month)
  const clock = now;
  clock.setMonth(now.getMonth() - 1);  // set to last month
  const year = clock.getUTCFullYear();
  const month = clock.getUTCMonth() + 1;

  const start = new Date(year, month - 1, 1).getTime();  // start of last month
  const end = new Date();
  return getUsageModelsForUser(username, start, end);
}

// Token
async function getModelTokenUsageThisMonth(username, model) {
  // Now
  const now = new Date();

  // Clock (this month)
  const clock = now;
  const year = clock.getUTCFullYear();
  const month = clock.getUTCMonth() + 1; // Add 1 because getUTCMonth() returns 0-11

  return getModelTokenUsageByMonth(username, model, year, month);
}

async function getModelTokenUsageLastMonth(username, model) {
  // Now
  const now = new Date();

  // Clock (last month)
  const clock = now;
  clock.setMonth(now.getUTCMonth() - 1);  // set to last month
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  return getModelTokenUsageByMonth(username, model, year, month);
}

async function getModelTokenUsageByMonth(username, model, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime();
  return await countTokenForUserByModel(username, model, start, end);
}

// Token frequencies
async function getModelTokenFrequencies(username, model) {
  const dailyStart = Date.now() - 86400000;
  const weeklyStart = Date.now() - 604800000;
  const monthlyStart = Date.now() - 2592000000;
  const end = Date.now();
  const daily = await countTokenForUserByModel(username, model, dailyStart, end);
  const weekly = await countTokenForUserByModel(username, model, weeklyStart, end);
  const monthly = await countTokenForUserByModel(username, model, monthlyStart, end);
  return {
    daily,
    weekly,
    monthly,
  }
}
