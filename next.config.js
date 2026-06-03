/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" }
    ]
  },
  experimental: {
    // Router-cache do client expira imediatamente em rotas dinâmicas/estáticas.
    // Garante que cada navegação refaz o fetch do server.
    staleTimes: {
      dynamic: 0,
      static: 0
    }
  }
};

module.exports = nextConfig;
