/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build mandiri (server.js + node_modules minimal) agar bisa dibungkus image Docker kecil.
  output: "standalone",
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    // Unggahan bukti dibatasi 5 MB per file (PRD 8.4); sisa ruang untuk overhead multipart.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
