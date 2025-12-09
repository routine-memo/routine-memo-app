import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = join(projectRoot, 'ggumori_app.png');
const outputDir = join(projectRoot, 'public', 'icons');

async function generateIcons() {
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Also generate favicon
  await sharp(inputPath)
    .resize(32, 32)
    .toFile(join(projectRoot, 'public', 'favicon.png'));
  console.log('Generated: favicon.png');

  // Generate badge icon from circle version (for push notifications)
  const circleInputPath = join(projectRoot, 'ggumori_circle.png');
  await sharp(circleInputPath)
    .resize(96, 96)
    .toFile(join(outputDir, 'badge-96x96.png'));
  console.log('Generated: badge-96x96.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
