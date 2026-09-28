import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard icon SVG (Full bleed for normal icon)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Outer Rounded Container -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.4"/>
  
  <!-- Subtle Grid Pattern in background -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" stroke-opacity="0.25"/>
  <circle cx="256" cy="256" r="215" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.15"/>
  
  <!-- Glowing central shield/badge -->
  <g filter="url(#glow)">
    <circle cx="256" cy="220" r="105" fill="#0b132b" stroke="url(#goldGrad)" stroke-width="6"/>
  </g>
  
  <!-- Number 50 in center -->
  <text x="256" y="245" font-family="'JetBrains Mono', 'Plus Jakarta Sans', system-ui, sans-serif" font-size="115" font-weight="900" text-anchor="middle" fill="url(#goldGrad)" letter-spacing="-3">50</text>
  
  <!-- Flame / Torch accent -->
  <path d="M 256 95 C 248 115 238 128 238 142 C 238 158 248 168 256 168 C 264 168 274 158 274 142 C 274 128 264 115 256 95 Z" fill="url(#flameGrad)" />

  <!-- Subtitle Ribbon -->
  <rect x="96" y="360" width="320" height="52" rx="26" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="2.5"/>
  <text x="256" y="394" font-family="'JetBrains Mono', 'Plus Jakarta Sans', system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle" fill="#f8fafc" letter-spacing="4">JEE SUPER-50</text>
  
  <!-- Small PCM dots -->
  <circle cx="206" cy="445" r="5" fill="#38bdf8"/>
  <circle cx="256" cy="445" r="5" fill="#34d399"/>
  <circle cx="306" cy="445" r="5" fill="#f43f5e"/>
</svg>`;

// 2. Maskable icon SVG (With 15% safe margin around all content as required by PWA standards)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="goldGradM" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  
  <!-- Full Bleed Background (no rx) -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>
  
  <!-- Safe Zone content scaled down to 75% in the center -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Central circle -->
    <circle cx="256" cy="220" r="115" fill="#0b132b" stroke="url(#goldGradM)" stroke-width="8"/>
    
    <!-- 50 -->
    <text x="256" y="250" font-family="'JetBrains Mono', 'Plus Jakarta Sans', system-ui, sans-serif" font-size="120" font-weight="900" text-anchor="middle" fill="url(#goldGradM)" letter-spacing="-3">50</text>
    
    <!-- Subtitle Banner -->
    <rect x="86" y="360" width="340" height="56" rx="28" fill="#0f172a" stroke="url(#goldGradM)" stroke-width="3"/>
    <text x="256" y="396" font-family="'JetBrains Mono', 'Plus Jakarta Sans', system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle" fill="#f8fafc" letter-spacing="4">SUPER-50</text>
  </g>
</svg>`;

async function buildIcons() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('Saved public/icon.svg');

  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved public/pwa-maskable-512x512.png');

  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved public/apple-touch-icon.png');

  // Also create a 32x32 favicon.png and copy to favicon.ico
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Saved public/favicon.ico');
}

buildIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
