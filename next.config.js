/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  images: {
    remotePatterns: [
      // ✅ SUPABASE (CORRIGIDO: ...cti e liberando object e render)
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
      // (opcional, mas deixo pra garantir)
      {
        protocol: "https",
        hostname: "skzcvpkmcktjryvstcti.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // ✅ CDN que você já usa
      {
        protocol: "https",
        hostname: "distro.fbitstatic.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
