/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    esmExternals: true,
  },

  images: {
    domains: ["skzcvpkmcktjryvstctl.supabase.co"],
  },
};

export default nextConfig;
