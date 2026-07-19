/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
    resolveAlias: {
      'node:child_process': './shared/empty.js',
      'node:fs': './shared/empty.js',
      'node:net': './shared/empty.js',
      'node:tls': './shared/empty.js',
      'node:dns': './shared/empty.js',
      'child_process': './shared/empty.js',
      'fs': './shared/empty.js',
      'net': './shared/empty.js',
      'tls': './shared/empty.js',
      'dns': './shared/empty.js',
    },
  },
};

export default nextConfig;
