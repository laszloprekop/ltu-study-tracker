// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // tracker/ (page shell, built-in plan) is read at request time; the Dockerfile copies it, and
  // sync/ for the hourly job, next to the standalone server.
};
export default nextConfig;
