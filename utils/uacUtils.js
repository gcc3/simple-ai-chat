import { countChatsForIP, countChatsForUser, countTokenForUserByModel, getUsageModelsForUser } from './sqliteUtils';
import { getRoleFequencyLimit, feeCal, gpt4vFeeCal, dbFeeCal, plusFeeCal } from './usageUtils';

const use_email = process.env.USE_EMAIL == "true" ? true : false;

// User access control utilities
export async function getUacResult(user, ip) {
  const isLogin = (user !== null && user !== undefined);

  if (!isLogin) {
    // Not a user, urge register a user
    const chatCount = await countChatsForIP(ip, Date.now() - 86400000, Date.now());

    // Forbidden as noticed some user user can use fake IP to bypass the limit
    // But if user cannot chat, it will be inconvenient... temporarily enabled.
    if (chatCount >= 5) {
      return {
        success: false,
        error: "Please login, or register with command `:user add [username] [email] [password?]` to continue."
      };
    }
  }
  
  // Check user status
  if (isLogin && user.status === 'suspend') {
    return {
      success: false,
      error: "Your account is being suspended. Please contact support at `support@simple-ai.io` for help."
    }
  }

  // Verify email
  if (isLogin && use_email && !user.email_verified_at) {
    // Urge verify email address
    return {
      success: false,
      error: "Please verify your email. To re-send verification email, login and use the command \`:user set email [email]\`."
    };
  }

  // Subscription expired
  if (isLogin && user.role_expires_at && user.role_expires_at < Date.now()) {
    // Urge extend subscription
    return {
      success: false,
      error: "Your subscription has expired. Please renew it to continue using our services."
    };
  }

  // Check usage exceeded or not
  if (isLogin) {
    // Check fequencies
    const fequenciesExceeded = await checkFequenciesExceeded(user);
    if (fequenciesExceeded) {
      return {
        success: false,
        error: "Your usage frequency has exceeded the limit. You can upgrade your subscription to increase the limit.",
      }
    }

    // Check usage fee
    const usageExceeded = await checkUsageExceeded(user);
    if (usageExceeded) {
      return {
        success: false,
        error: "You have exceeded your usage limit. While Simple AI offers free features, the OpenAI API and associated tokens incur costs. Please add funds to your balance to continue.",
      }
    }
  }

  return {
    success: true,
    message: "UAC verification passed.",
  };
}

async function checkFequenciesExceeded(user) {
  if (user.role == "root_user") {
    return false;
  }

  const daily = await countChatsForUser(user.username, Date.now() - 86400000, Date.now());
  const weekly = await countChatsForUser(user.username, Date.now() - 604800000, Date.now());
  const monthly = await countChatsForUser(user.username, Date.now() - 2592000000, Date.now());
  const usageLimit = getRoleFequencyLimit(user.role);
  if (daily >= usageLimit.daily_limit || weekly >= usageLimit.weekly_limit || monthly >= usageLimit.monthly_limit) {
    // Usage exceeded
    return true;
  } else {
    return false;
  }
}

async function checkUsageExceeded(user) {
  // Total fee
  const totalFee = getTotalFee(user.username);

  // Add plus system fee
  const plusFee = plusFeeCal(user.role, totalFee);

  if (totalFee + plusFee > user.balance) {
    // Usage exceeded
    return true;
  } else {
    return false;
  }
}

// Usage models (this month first day ~ now)
async function getUsageModels(username) {
  // Now
  const now = new Date();

  // Clock (last month)
  const clock = now;
  const year = clock.getUTCFullYear();
  const month = clock.getUTCMonth() + 1;

  const start = new Date(year, month - 1, 1).getTime();  // start of last month
  const end = new Date();
  return getUsageModelsForUser(username, start, end);
}

// Get total fee
async function getTotalFee(username) {
  // Get used models this month
  const usageModels = await getUsageModels(username);

  // Get total fee
  let totalUsageFeeThisMonth = 0;
  for (const model of usageModels) {
    // Count token
    const tokenUsageThisMonth = await getModelTokenUsageThisMonth(username, model);

    // Fee calculation
    const feeThisMonth = feeCal(model, tokenUsageThisMonth.input, tokenUsageThisMonth.output);

    // Add to total
    totalUsageFeeThisMonth += feeThisMonth;
  }

  // Total fee
  return totalUsageFeeThisMonth;
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

async function getModelTokenUsageByMonth(username, model, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime();
  return await countTokenForUserByModel(username, model, start, end);
}