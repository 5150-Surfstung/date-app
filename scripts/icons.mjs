// Generates the app icons from one SVG: tomato ground, white slash.
// Run: NODE_PATH=<dir with sharp> node scripts/icons.mjs
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const RED = '#FF3B2F'
// The slash, drawn as a parallelogram in a 512 box. Scale 1 = the rounded
// icon; maskable icons shrink it to sit inside the 80% safe zone.
function slash(scale = 1) {
  const c = 256
  const pts = [[300, 92], [378, 92], [212, 420], [134, 420]]
    .map(([x, y]) => [c + (x - c) * scale, c + (y - c) * scale].map((n) => n.toFixed(1)).join(','))
    .join(' ')
  return `<polygon points="${pts}" fill="#fff"/>`
}
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${RED}"/>${slash(1)}</svg>`
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${RED}"/>${slash(0.8)}</svg>`

mkdirSync('public/icons', { recursive: true })
writeFileSync('app/icon.svg', rounded)
const jobs = [
  ['public/icons/icon-192.png', rounded, 192],
  ['public/icons/icon-512.png', rounded, 512],
  ['public/icons/maskable-192.png', square, 192],
  ['public/icons/maskable-512.png', square, 512],
  ['app/apple-icon.png', square, 180],
]
for (const [file, svg, size] of jobs) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}
