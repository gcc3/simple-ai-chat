import { getUser, countChatsForIP, countChatsForUser, countTokenForUserByModel } from './sqliteUtils';
import { getRoleFequencyLimit, gpt4FeeCal, gpt4vFeeCal, dbFeeCal } from './usageUtils';

const use_email = process.env.USE_EMAIL == "true" ? true : false;

// User access control utilities
export async function getUacResult(user, ip) {
  const isLogin = user !== null;

  if (!isLogin) {
    // Not a user, urge register a user
    const chatCount = await countChatsForIP(ip, Date.now() - 86400000 * 3, Date.now());
    if (chatCount >= 5) {
      return {
        success: false,
        error: "Please login or register a user to continue, you can use the command \`:user add [username] [email] [password?]\` to register a user."
      };
    }
  }

  // Verify email
  if (isLogin && use_email && !user.email_verified_at) {
    // Urge verify email address
    return {
      success: false,
      error: "Please verify your email to continue. To send verification again, you can use the command \`:user set email [email]\`."
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
        error: "Your usage fequencies has exceeded the limit. Please upgrade your subscription to continue using our services.",
      }
    }

    // Check usage fee
    const usageExceeded = await checkUsageExceeded(user);
    if (usageExceeded) {
      return {
        success: false,
        error: "Your usage fee has exceeded. Please charge your balance to continue using our services.",
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
  // GPT-4 Turbo fee
  const gpt4Token = await getUserTokenUsageThisMonth(user.username, process.env.MODEL);
  const gpt4Fee = gpt4FeeCal(gpt4Token.input, gpt4Token.output);

  // GPT-4 Vision fee
  const gpt4vToken = await getUserTokenUsageThisMonth(user.username, process.env.MODEL_V);
  const gpt4vFee = gpt4vFeeCal(gpt4vToken.input, gpt4vToken.output);

  // Total fee
  const totalFee = gpt4Fee + gpt4vFee;

  if (totalFee > user.balance) {
    // Usage exceeded
    return true;
  } else {
    return false;
  }
}

async function getUserTokenUsageThisMonth(username, model) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Add 1 because getMonth() returns 0-11
  return getUserTokenUsageByMonth(username, model, year, month);
}

async function getUserTokenUsageByMonth(username, model, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startTime = new Date(year, month - 1, 1).getTime();
  const endTime = new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime();
  return await countTokenForUserByModel(username, model, startTime, endTime);
}
