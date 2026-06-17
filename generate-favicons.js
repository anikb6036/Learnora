import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const outputDir = path.join(process.cwd(), 'public');

  if (!fs.existsSync(svgPath)) {
    console.error('Error: favicon.svg not found in public directory!');
    process.exit(1);
  }

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.ico', size: 48 } // Chrome/Firefox fallbacks
  ];

  console.log('Generating PNG favicons from SVG...');

  for (const item of sizes) {
    const outputPath = path.join(outputDir, item.name);
    await sharp(svgPath)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);
    console.log(`- Created ${item.name} (${item.size}x${item.size})`);
  }

  console.log('All favicons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
