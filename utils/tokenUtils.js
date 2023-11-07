// Max tokens for differnet models
const max_tokens_dict = {
  "gpt-4-1106-preview": 128000,
  "gpt-4-vision-preview": 500,
  "gpt-4": 8192,
  "gpt-3.5-turbo-1106": 16385,
  "gpt-3.5-turbo": 4096,
  "gpt-3.5-16k": 16385,
};

export function getMaxTokens(model) {
  // only use halp of the max tokens to avoid exceeding the limit
  return max_tokens_dict[model] / 2;
}