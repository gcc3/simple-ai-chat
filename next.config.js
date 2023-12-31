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
  images: {
    domains: ['simpleaibucket.s3.amazonaws.com'],
  },
}

module.exports = nextConfig