/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    BSCSCAN_API_KEY: process.env.BSCSCAN_API_KEY,
    CRYPTO_WALLET_ADDRESS: process.env.CRYPTO_WALLET_ADDRESS,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["api.qrserver.com"],
    unoptimized: true,
  },
}

module.exports = nextConfig
