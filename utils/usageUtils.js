import { npre } from "./numberUtils";

// Refer, https://openai.com/api/pricing/
export function feeCal(model, input_token_ct, output_token_ct) {
  let input_pricing = 0;
  let output_pricing = 0;

  if (model === "gpt-4o") {
    input_pricing  = 0.000005;
    output_pricing = 0.000015;
  }

  if (model === "gpt-4o-mini") {
    input_pricing  = 0.00000015;
    output_pricing = 0.0000006;
  }

  const fee = input_token_ct * input_pricing + output_token_ct * output_pricing;
  return npre(fee); // Rounds to 5 decimal places
}

export function plusFeeCal(role, totalFee) {
  let plusSystemFee = 0;
  if (role === "user") plusSystemFee = totalFee * 0.03;
  if (role === "pro_user") plusSystemFee = totalFee * 0.02;
  if (role === "super_user") plusSystemFee = totalFee * 0.01;
  return npre(plusSystemFee);
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

  let usage_limit = null;
  const role_usage_limit = process.env.NEXT_PUBLIC_ROLE_USAGE_LIMIT ? process.env.NEXT_PUBLIC_ROLE_USAGE_LIMIT : "";
  const foundItem = role_usage_limit.split(";").find((item) => {
    return item.split(":")[0] === role;
  });
  if (foundItem) {
    usage_limit = foundItem.split(":")[1];
  } else {
    console.error("Role not found for:", role);
  }

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
