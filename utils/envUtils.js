export function getUsageLimit (role) {
  const usage_limit = process.env.USAGE_LIMIT ? process.env.USAGE_LIMIT : "";
  const role_usage_limit = usage_limit.split(";").find((item) => item.split(":")[0] === role).split(":")[1];

  // If role is not found, return 0
  if (!role_usage_limit) return {
    usage_limit_daily: 0,
    usage_limit_weekly: 0,
    usage_limit_monthly: 0,
  };

  const daily = role_usage_limit.split(",")[0];
  const weekly = role_usage_limit.split(",")[1];
  const monthly = role_usage_limit.split(",")[2];
  return {
    daily,
    weekly,
    monthly,
  }
}
