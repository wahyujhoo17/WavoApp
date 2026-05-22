import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load .env from the engine folder so this app uses its local env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
};

export default nextConfig;
