export function getUsageLimit (role) {
  const usage_limit = process.env.USAGE_LIMIT ? process.env.USAGE_LIMIT : "";
  const role_usage_limit = usage_limit.split(";").find((item) => item.split(":")[0] === role).split(":")[1];

  // If role is not found, return 0
  if (!role_usage_limit) {
    return {
      usage_limit_daily: 0,
      usage_limit_weekly: 0,
      usage_limit_monthly: 0,
    };
  }

  let daily = role_usage_limit.split(",")[0];
  if (daily === "") {
    daily = Number.MAX_VALUE;
  }

  let weekly = role_usage_limit.split(",")[1];
  if (weekly === "") {
    weekly = Number.MAX_VALUE;
  }

  let monthly = role_usage_limit.split(",")[2];
  if (monthly === "") {
    monthly = Number.MAX_VALUE;
  }
  
  return {
    daily,
    weekly,
    monthly,
  }
}
