/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    esmExternals: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "skzcvpkmcktjryvstctl.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
