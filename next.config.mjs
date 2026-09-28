/** @type {import('next').NextConfig} */
const nextConfig = {
  // STATIC_EXPORT=1 (GitHub Pages) builds a static site; short links then
  // rely on the 404-page redirect. On Vercel the app runs as real Next.js
  // and /maya is a dynamic route.
  output: process.env.STATIC_EXPORT ? 'export' : undefined,
  images: { unoptimized: true },
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
}

export default nextConfig
