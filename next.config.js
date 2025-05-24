import nextPWA from 'next-pwa';

// Determine development mode
const isDev = process.env.NODE_ENV === 'development';

// Extracted Next.js configuration
export const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
};

// Setup PWA wrapper
const withPWA = nextPWA({ 
  dest: 'public',
  disable: isDev,
});

// Export wrapped configuration
export default withPWA(nextConfig);
