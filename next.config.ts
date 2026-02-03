import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 禁用 React Strict Mode，避免开发模式下组件双重渲染导致 WebSocket 断连
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
};

export default nextConfig;
