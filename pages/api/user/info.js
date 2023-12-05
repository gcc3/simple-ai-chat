import { getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { countChatsForUser } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Method Not Allowed if not GET
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;

  try {
    const user = await getUser(username);
    if (user) {
      res.status(200).json({ 
        user: {
          id: user.id, 
          username: user.username,
          role: user.role,
          email: user.email,
          settings: user.settings,
          usage: JSON.stringify(await getUserUsageWithLimit(user.username, user.role)),
        }
      });
    } else {
      // Clear the auth token cookie
      res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);

      // Return user is removed when user not exist
      res.status(404).json({ error: 'User has been removed.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getUserUsageWithLimit(username, role) {
  const { daily, weekly, monthly } = await getUserUsage(username);
  const { daily_limit, weekly_limit, monthly_limit } = getUsageLimit(role);

  let exceeded = false;
  if (daily >= daily_limit || weekly >= weekly_limit || monthly >= monthly_limit) {
    exceeded = true;
  }

  return {
    daily: daily + "/" + daily_limit,
    weekly: weekly + "/" + weekly_limit,
    monthly: monthly + "/" + monthly_limit,
    exceeded,
  }
}

function getUsageLimit(role) {
  const usage_limit = process.env.USAGE_LIMIT ? process.env.USAGE_LIMIT : "";
  const role_usage_limit = usage_limit.split(";").find((item) => item.split(":")[0] === role).split(":")[1];
  if (!role_usage_limit) return {
    usage_limit_daily: 0,
    usage_limit_weekly: 0,
    usage_limit_monthly: 0,
  };

  const daily_limit = role_usage_limit.split(",")[0];
  const weekly_limit = role_usage_limit.split(",")[1];
  const monthly_limit = role_usage_limit.split(",")[2];
  return {
    daily_limit,
    weekly_limit,
    monthly_limit,
  }
}

async function getUserUsage(username) {
  const dailyChatCount = await countChatsForUser(username, Date.now() - 86400000, Date.now());
  const weeklyChatCount = await countChatsForUser(username, Date.now() - 604800000, Date.now());
  const monthlyChatCount = await countChatsForUser(username, Date.now() - 2592000000, Date.now());
  return {
    daily: dailyChatCount,
    weekly: weeklyChatCount,
    monthly: monthlyChatCount,
  }
}
