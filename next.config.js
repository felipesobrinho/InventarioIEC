const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  turbopack: {},

  webpack: (config) => {
    config.resolve.alias.canvas = {
      ...config.resolve.alias.canvas,
      canvas: false,
    }
  },
}
module.exports = nextConfig