/** @type {import('next').NextConfig} */
const nextConfig = {
  // Activer le mode strict React
  reactStrictMode: true,

  // Inclure les polices pdfkit dans le bundle serverless (Vercel)
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/pdfkit/js/data/**/*'],
  },

  // Ignorer les erreurs TS au build (fix progressif en cours)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuration des images
  images: {
    domains: [],
  },

  // Headers de securite
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Permettre l'iframe embedding pour les routes /embed/*
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
  },

  // Redirections
  async redirects() {
    return [
      {
        source: '/espace-membre/mon-profil/password',
        destination: '/espace-membre/mon-profil?tab=securite',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
