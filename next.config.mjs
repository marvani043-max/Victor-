/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Set NEXT_PUBLIC_BASE_PATH (e.g. "/Victor-") when hosting under a sub-folder such as GitHub Pages.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};
export default nextConfig;
