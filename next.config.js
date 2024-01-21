/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',  // all routes
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },  // CORS
        ],
      },
    ]
  },
  i18n: {
    locales: ['en', 'zh', 'ja'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig
