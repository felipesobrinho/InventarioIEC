const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  webpack: (config) => {
    // react-pdf usa canvas opcionalmente — ignorar se não disponível
    config.resolve.alias.canvas = false
    return config
  },
}
module.exports = nextConfig