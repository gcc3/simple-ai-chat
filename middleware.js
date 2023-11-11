import { authenticate } from 'utils/authUtils.js';
 
// This function can be marked `async` if using `await` inside
export function middleware(req, res) {
  return;
}

export const config = {
  matcher: '/:path*',
}
