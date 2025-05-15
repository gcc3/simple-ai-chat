import { countChatsForIP, countChatsForUser } from './sqliteUtils';
import { getRoleFequencyLimit } from './usageUtils';

const use_email = process.env.USE_EMAIL == "true" ? true : false;

// User access control utilities
export async function getUacResult(user, ip) {
  const isLogin = (user !== null && user !== undefined);

  if (!isLogin) {
    // Not a user, urge register a user
    const chatCount = await countChatsForIP(ip, Date.now() - 86400000, Date.now());

    // Forbidden as noticed some users can use fake IP to bypass the limit
    // But if user cannot chat, it will be inconvenient... temporarily enabled.
    if (chatCount > 7) {
      return {
        success: false,
        error: "Register as a user to continue. Use the command `:user add [username] [email] [password?]`. Or log in if you are already a user.\n" 
           + "\nAfter your registration, you can use command: `:session attach " + getSetting("session") + "` to resume current conversation."
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
        error: "Your usage frequency has reached the limit. You can upgrade your subscription to increase the limit.",
      }
    }

    // Check usage fee
    const isUsageExceeded = await checkUsageExceeded(user);
    if (isUsageExceeded) {
      return {
        success: false,
        error: "You have reached your usage limit. Please add credit to your balance in `Usage` page.\n" + 
               "您的使用额度已达到上限，请前往【用量】页面进行充值。"
      };
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
