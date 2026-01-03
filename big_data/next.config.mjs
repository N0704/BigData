/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "photo-baomoi.bmcdn.me",
      },
    ],
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
