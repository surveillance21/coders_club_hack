import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Suppress cross-origin warnings when tunneling Next.js via localtunnel or ngrok or accessing via local IP
    experimental: {
        serverActions: {
            allowedOrigins: ["*.loca.lt", "localhost:3000", "192.168.12.120:3000", "192.168.31.187:3000", "*.localhost.run"]
        },
        // For Next.js 15+ local networking warnings:
        // @ts-ignore
        allowedDevOrigins: ["localhost:3000", "192.168.31.187:3000", "*.localhost.run"]
    }
};

export default nextConfig;
