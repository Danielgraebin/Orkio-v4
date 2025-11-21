/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  },
  async rewrites() {
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1","");
    return [
      { source: "/api/:path*", destination: `${base}/api/:path*` }
    ];
  }
}
module.exports = nextConfig;
