/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3", "tesseract.js"],

  webpack: (config, { dev }) => {
    if (dev) {
      // The SQLite database, its WAL sidecar and the uploads folder all live
      // inside the project. Without this, every single write touches a watched
      // file, Fast Refresh rebuilds in a loop, and the dev server's route
      // manifest eventually falls over.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/data/**",
          "**/uploads/**",
          "**/samples/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
