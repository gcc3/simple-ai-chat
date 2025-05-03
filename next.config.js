/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*', // all routes
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // CORS
        ],
      },
    ]
  }
}

export default nextConfig