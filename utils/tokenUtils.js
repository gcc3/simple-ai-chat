import { encoding_for_model } from "tiktoken";

function isTiktokenModel(modelName) {
  return modelName.startsWith("gpt-") || modelName.startsWith("o1") || modelName.startsWith("o2") || modelName.startsWith("o3") || modelName.startsWith("o4") || modelName.includes("chatgpt");;
}

function countWords(str) {
  const matches = str.match(/[\w'-]+|[\u4e00-\u9fa5]/g);
  return matches ? matches.length : 0;
}

export function countToken(model, input) {
  if (!isTiktokenModel(model)) {
    const wordsCount = countWords(input);
    return wordsCount * 1.3; // 1.3 is a rough estimate for the average token count per word
  }

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
