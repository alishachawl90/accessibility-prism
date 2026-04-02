import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG_PATH = join(ROOT, 'public', 'icons', 'prism.svg');
const OUT_DIR = join(ROOT, 'public', 'icons');

const SIZES = [16, 32, 48, 128];

mkdirSync(OUT_DIR, { recursive: true });

const svgBuffer = readFileSync(SVG_PATH);

for (const size of SIZES) {
  const outPath = join(OUT_DIR, `icon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`Generated ${outPath} (${size}x${size})`);
}

console.log('Done — all icon sizes generated.');
