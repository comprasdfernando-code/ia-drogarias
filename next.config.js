/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  images: {
    domains: ['skzcvpkmcktjryvstcti.supabase.co'],
  },
};

export default nextConfig;