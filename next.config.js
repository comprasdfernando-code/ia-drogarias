/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  images: {
    unoptimized: true, // 👈 ADICIONA ISSO

    remotePatterns: [
      {
        protocol: "https",
        hostname: "skzcvpkmcktjryvstcti.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "skzcvpkmcktjryvstcti.supabase.co",
        pathname: "/storage/v1/render/image/**",
      },
      {
        protocol: "https",
        hostname: "skzcvpkmcktjryvstcti.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "distro.fbitstatic.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
