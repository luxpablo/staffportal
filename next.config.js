/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  images: { remotePatterns: [{ hostname: "**" }] },
};
module.exports = nextConfig;
