import { authenticate } from 'utils/authUtils.js';
 
// This function can be marked `async` if using `await` inside
export function middleware(req, res) {

  // Authentication
  const authResult = authenticate(req);
  if (authResult.success) {
    
  }
  
  return;
}

export const config = {
  matcher: '/:path*',
}
