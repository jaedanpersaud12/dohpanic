/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native/wasm-heavy packages that must not be bundled into the server build.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
