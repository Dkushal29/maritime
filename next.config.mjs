/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL;

    // In production on Vercel, allow proxying /api/backend/:path* to live FastAPI service if URL is external
    if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
      return [
        {
          source: '/api/backend/:path*',
          destination: `${backendUrl.replace(/\/$/, '')}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
