const isDataUri = (str) => /^data:image\/[a-z0-9.+-]+;base64,/i.test(str);

export const toDataUri = (b64) =>
  isDataUri(b64) ? b64 : `data:image/png;base64,${b64}`;