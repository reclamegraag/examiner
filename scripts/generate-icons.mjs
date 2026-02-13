import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = join(import.meta.dirname, '..', 'public');
const APP_DIR = join(import.meta.dirname, '..', 'src', 'app');

// Graduation cap icon on accent-colored rounded background
// Matches the app's neo-brutalist style with #E85D3A accent
function createIconSvg(size) {
  const padding = Math.round(size * 0.15);
  const iconSize = size - padding * 2;
  const cornerRadius = Math.round(size * 0.2);

  // Scale the graduation cap path to fit
  const capScale = iconSize / 100;
  const capOffsetX = padding;
  const capOffsetY = padding;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#E85D3A"/>
  <g transform="translate(${capOffsetX}, ${capOffsetY}) scale(${capScale})">
    <!-- Graduation cap -->
    <polygon points="50,20 10,42 50,64 90,42" fill="#FFFFFF"/>
    <rect x="47" y="42" width="6" height="24" fill="#FFFFFF" rx="1"/>
    <path d="M 25,48 L 25,65 C 25,72 37,80 50,80 C 63,80 75,72 75,65 L 75,48 L 50,62 Z" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="25" cy="68" r="3.5" fill="#FBF5EB"/>
    <rect x="23.5" y="65" width="3" height="10" fill="#FBF5EB" rx="0.5"/>
  </g>
</svg>`;
}

// Maskable icon has more padding (safe zone is inner 80%)
function createMaskableIconSvg(size) {
  const safeZonePadding = Math.round(size * 0.1);
  const innerSize = size - safeZonePadding * 2;
  const iconPadding = Math.round(innerSize * 0.15);
  const iconSize = innerSize - iconPadding * 2;
  const capScale = iconSize / 100;
  const capOffsetX = safeZonePadding + iconPadding;
  const capOffsetY = safeZonePadding + iconPadding;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#E85D3A"/>
  <g transform="translate(${capOffsetX}, ${capOffsetY}) scale(${capScale})">
    <polygon points="50,20 10,42 50,64 90,42" fill="#FFFFFF"/>
    <rect x="47" y="42" width="6" height="24" fill="#FFFFFF" rx="1"/>
    <path d="M 25,48 L 25,65 C 25,72 37,80 50,80 C 63,80 75,72 75,65 L 75,48 L 50,62 Z" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="25" cy="68" r="3.5" fill="#FBF5EB"/>
    <rect x="23.5" y="65" width="3" height="10" fill="#FBF5EB" rx="0.5"/>
  </g>
</svg>`;
}

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-icon.png', size: 180, maskable: false },
];

for (const { name, size, maskable } of sizes) {
  const svg = maskable ? createMaskableIconSvg(size) : createIconSvg(size);
  const dir = name === 'apple-icon.png' ? APP_DIR : PUBLIC_DIR;
  const outputPath = join(dir, name);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath} (${size}x${size})`);
}

console.log('All icons generated!');
