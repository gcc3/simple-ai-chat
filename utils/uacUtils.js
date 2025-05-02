import { countChatsForIP, countChatsForUser } from './sqliteUtils';
import { getRoleFequencyLimit } from './usageUtils';

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
    // Check frequencies
    const isFrequenciesExceeded = await checkFrequenciesExceeded(user);
    if (isFrequenciesExceeded) {
      return {
        success: false,
        error: "Your usage frequency has exceeded the limit. You can upgrade your subscription to increase the limit.",
      }
    }

    // Check usage fee
    const isUsageExceeded = await checkUsageExceeded(user);
    if (isUsageExceeded) {
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

async function checkFrequenciesExceeded(user) {
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
  // Check usage fee
  if (user.usage > user.balance) {
    console.log("⚠️ Usage exceeded, user: " + user.name + ", usage: " + user.usage + ", balance: " + user.balance);
    // Usage exceeded
    return true;
  } else {
    return false;
  }
}
