export function isNode() {
  let isNode =
    typeof window === 'undefined' ||
    typeof localStorage === 'undefined' ||
    typeof sessionStorage === 'undefined';

  return isNode;
}
