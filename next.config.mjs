/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-side packages used in API routes
  serverExternalPackages: ['pg', 'bcryptjs'],
};

export default nextConfig;
