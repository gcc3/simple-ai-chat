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
  buildExcludes: [/dynamic-css-manifest.json$/],  // fix a bad-precaching-response error
  runtimeCaching: [
    {
      urlPattern: /^\/_next\/static\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      }
    },
    {
      urlPattern: /^\/api\//,
      handler: 'NetworkOnly',
      options: {
        precacheFallback: {
          fallbackURL: '/_offline',
        }
      }
    },
    {
      urlPattern: /^\/ping\//,
      handler: 'NetworkOnly',
      options: {
        precacheFallback: {
          fallbackURL: '/_offline',
        }
      }
    }
  ],
});

// Export wrapped configuration
export default withPWA(nextConfig);
