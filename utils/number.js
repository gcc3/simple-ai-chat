// Number precision
export function npre(num, precision = 5) {
  if (num && typeof num === "number") {
    return parseFloat(num.toFixed(precision));
  }
  return 0;
}
