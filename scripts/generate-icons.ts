import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(process.cwd(), 'public', 'icons');

// SVG 아이콘 (앰버색 배경에 R 글자)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#f59e0b"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">R</text>
</svg>
`;

async function generateIcons() {
  // icons 폴더가 없으면 생성
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Created: icon-${size}x${size}.png`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
