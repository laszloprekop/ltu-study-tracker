// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // The page is read from tracker/ at request time; ship it with the standalone server.
  outputFileTracingIncludes: { "/": ["./tracker/**"] },
};
export default nextConfig;
