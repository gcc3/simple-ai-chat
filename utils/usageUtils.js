export function gpt4FeeCal(input_token_ct, output_token_ct) {
  const fee = input_token_ct * 0.00001 + output_token_ct * 0.00003;
  return parseFloat(fee.toFixed(5)); // Rounds to 5 decimal places
}

export function gpt4vFeeCal(input_token_ct, output_token_ct) {
  const fee = input_token_ct * 0.00001 + output_token_ct * 0.00003;
  return parseFloat(fee.toFixed(5)); // Rounds to 5 decimal places
}

export function dbFeeCal(sizeInKb) {
  return sizeInKb * (5 * 1024 / 1.25);
}

export function getRoleFequencyLimit(role) {
  if (role === "root_user") {
    return {
      daily_limit: null,
      weekly_limit: null,
      monthly_limit: null,
    };
  }

  const role_usage_limit = process.env.ROLE_USAGE_LIMIT ? process.env.ROLE_USAGE_LIMIT : "";
  const usage_limit = role_usage_limit.split(";").find((item) => item.split(":")[0] === role).split(":")[1];

  // If role is not found, return 0
  if (!usage_limit) {
    return {
      daily_limit: 0,
      weekly_limit: 0,
      monthly_limit: 0,
    };
  }

  let daily_limit = usage_limit.split(",")[0];
  if (daily_limit === "") {
    daily_limit = null;
  }

  let weekly_limit = usage_limit.split(",")[1];
  if (weekly_limit === "") {
    weekly_limit = null;
  }

  let monthly_limit = usage_limit.split(",")[2];
  if (monthly_limit === "") {
    monthly_limit = null;
  }
  
  return {
    daily_limit,
    weekly_limit,
    monthly_limit,
  }
}