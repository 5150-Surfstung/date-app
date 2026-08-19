/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the browser talks directly to Supabase; RLS is the API.
  output: 'export',
  images: { unoptimized: true },
  // Set BASE_PATH=/date-app when deploying under a subpath (GitHub Pages).
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
}

export default nextConfig
