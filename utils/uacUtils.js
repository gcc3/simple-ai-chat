import { authenticate } from './authUtils';
import { getUser, countChatsForIP } from './sqliteUtils';
import { checkUsageExceeded } from './usageUtils';

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
    const exceeded = await checkUsageExceeded(user);
    if (exceeded) {
      return {
        success: false,
        error: "Your usage has exceeded the limit. Please upgrade your subscription to continue using our services.",
      }
    }
  }

  return {
    success: true,
    message: "UAC verification passed.",
  };
}