/**
 * Generates solid-color PWA launcher icons (theme blue) into public/AppImages.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bg = { r: 79, g: 134, b: 255, alpha: 1 };

async function solidPng(outPath, size) {
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .png()
    .toFile(outPath);
}

async function main() {
  const androidDir = path.join(root, 'public', 'AppImages', 'android');
  const iosDir = path.join(root, 'public', 'AppImages', 'ios');
  fs.mkdirSync(androidDir, { recursive: true });
  fs.mkdirSync(iosDir, { recursive: true });

  const sizes = [48, 72, 96, 144, 192, 512];
  for (const s of sizes) {
    const out = path.join(androidDir, `android-launchericon-${s}-${s}.png`);
    await solidPng(out, s);
    console.log('wrote', out);
  }

  await solidPng(path.join(iosDir, '180.png'), 180);
  console.log('wrote', path.join(iosDir, '180.png'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
