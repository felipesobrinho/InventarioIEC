const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  turbopack: {},

  webpack: (config) => {
    if (!config.resolve) {
      config.resolve = {}
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }

    config.resolve.alias.canvas = false

    return config
  },
}

module.exports = nextConfig
