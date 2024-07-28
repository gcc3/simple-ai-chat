import { get_encoding, encoding_for_model } from "tiktoken";

// Max tokens for differnet models
// Refer: https://platform.openai.com/playground/chat
const max_tokens_dict = {
  "gpt-4o": 4095,              // 4095 is the max token, not 4096
  "gpt-4o-mini": 4095,         // maybe, same as gpt-4o
  "gpt-4-1106-preview": 4095,  // 4095 is the max token, not 4096
  "gpt-4": 8191,
  "gpt-3.5-turbo": 4096,       // 4096 is the max token
  "gpt-3.5-turbo-16k": 8192 ,  // 16384 is the max token, but it's too large, so we only use half of it
};

export function getMaxTokens(model) {
  // Check the model is in the dictionary
  if (!(model in max_tokens_dict)) {
    return 4000;  // default max token
  }

  return max_tokens_dict[model];
}

export function countToken(model, input) {
  try {
    const encoding = encoding_for_model(model);
    const tokens = encoding.encode(input);
    const tokenCount = tokens.length;
    encoding.free();
    return tokenCount;
  } catch (error) {
    return 0;
  }
}
