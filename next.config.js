/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  images: {
    domains: ["skzcvpkmcktjryvstctl.supabase.co"], // ✅ CORRETO: ctl
  },
};

export default nextConfig;
