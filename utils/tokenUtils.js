import { encoding_for_model } from "tiktoken";

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
