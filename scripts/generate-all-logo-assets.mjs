import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourcePath = 'C:/Users/soham/.gemini/antigravity/brain/ae031a70-d8c2-4341-938b-48ecde1f95a5/.user_uploaded/media_1791560331802_1e8c995b.png';
const publicDir = 'd:/Projects/ZDrop/public';
const appDir = 'd:/Projects/ZDrop/src/app';

// Helper to create ICO binary buffer
function createIcoBuffer(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  let currentOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // number of images

  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size of image data
    entry.writeUInt32LE(currentOffset, 12); // offset of image data
    entries.push(entry);
    currentOffset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...entries,
    ...pngBuffers.map(p => p.buffer)
  ]);
}

async function run() {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(appDir, { recursive: true });

  const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // We will produce two buffers:
  // 1. lightBuffer: original colors unmixed from white background
  // 2. darkBuffer: same, but the "Drop" text (which is dark navy in original) is recolored to white (#fafafa)
  const lightBuffer = Buffer.alloc(width * height * 4);
  const darkBuffer = Buffer.alloc(width * height * 4);

  // Background is near-white (255, 255, 255)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const outIdx = (y * width + x) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Distance from white
      const distFromWhite = Math.sqrt(
        Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2)
      );

      if (distFromWhite < 8) {
        // Pure transparent background
        lightBuffer[outIdx + 3] = 0;
        darkBuffer[outIdx + 3] = 0;
        continue;
      }

      // Check if this is the Green section (mark x < 380 OR 'Z' 415 <= x <= 500)
      const isGreen = (x <= 500);

      if (isGreen) {
        // Foreground is emerald green (~1, 186, 86)
        // Red channel goes from ~0..2 up to 255 for white
        let alpha = (255 - r) / 254;
        alpha = Math.max(0, Math.min(1, alpha));

        if (alpha <= 0.04) {
          lightBuffer[outIdx + 3] = 0;
          darkBuffer[outIdx + 3] = 0;
          continue;
        }

        // Unmix green
        let fgR = 1;
        let fgG = Math.max(0, Math.min(255, Math.round((g - (1 - alpha) * 255) / alpha)));
        let fgB = Math.max(0, Math.min(255, Math.round((b - (1 - alpha) * 255) / alpha)));

        if (alpha >= 0.95) {
          fgR = r;
          fgG = g;
          fgB = b;
          alpha = 1;
        }

        const aByte = Math.round(alpha * 255);

        lightBuffer[outIdx] = fgR;
        lightBuffer[outIdx + 1] = fgG;
        lightBuffer[outIdx + 2] = fgB;
        lightBuffer[outIdx + 3] = aByte;

        darkBuffer[outIdx] = fgR;
        darkBuffer[outIdx + 1] = fgG;
        darkBuffer[outIdx + 2] = fgB;
        darkBuffer[outIdx + 3] = aByte;
      } else {
        // This is the "Drop" text (dark navy: ~7, 16, 35)
        const maxDiff = Math.max(255 - r, 255 - g, 255 - b);
        let alpha = maxDiff / 248;
        alpha = Math.max(0, Math.min(1, alpha));

        if (alpha <= 0.04) {
          lightBuffer[outIdx + 3] = 0;
          darkBuffer[outIdx + 3] = 0;
          continue;
        }

        let fgR = 7;
        let fgG = 16;
        let fgB = 35;

        if (alpha >= 0.95) {
          fgR = r;
          fgG = g;
          fgB = b;
          alpha = 1;
        } else {
          fgR = Math.max(0, Math.min(255, Math.round((r - (1 - alpha) * 255) / alpha)));
          fgG = Math.max(0, Math.min(255, Math.round((g - (1 - alpha) * 255) / alpha)));
          fgB = Math.max(0, Math.min(255, Math.round((b - (1 - alpha) * 255) / alpha)));
        }

        const aByte = Math.round(alpha * 255);

        // Light mode has original dark navy
        lightBuffer[outIdx] = fgR;
        lightBuffer[outIdx + 1] = fgG;
        lightBuffer[outIdx + 2] = fgB;
        lightBuffer[outIdx + 3] = aByte;

        // Dark mode has crisp white (#fafafa)
        darkBuffer[outIdx] = 250;
        darkBuffer[outIdx + 1] = 250;
        darkBuffer[outIdx + 2] = 250;
        darkBuffer[outIdx + 3] = aByte;
      }
    }
  }

  // Measure bounding boxes
  let fullMinX = width, fullMaxX = 0, fullMinY = height, fullMaxY = 0;
  let markMinX = width, markMaxX = 0, markMinY = height, markMaxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (lightBuffer[idx + 3] > 10) {
        if (x < fullMinX) fullMinX = x;
        if (x > fullMaxX) fullMaxX = x;
        if (y < fullMinY) fullMinY = y;
        if (y > fullMaxY) fullMaxY = y;

        if (x <= 380) {
          if (x < markMinX) markMinX = x;
          if (x > markMaxX) markMaxX = x;
          if (y < markMinY) markMinY = y;
          if (y > markMaxY) markMaxY = y;
        }
      }
    }
  }

  console.log('Detected Full Logo Box:', { fullMinX, fullMinY, fullMaxX, fullMaxY });
  console.log('Detected Mark Box:', { markMinX, markMinY, markMaxX, markMaxY });

  const markWidth = markMaxX - markMinX + 1;
  const markHeight = markMaxY - markMinY + 1;
  const fullWidth = fullMaxX - fullMinX + 1;
  const fullHeight = fullMaxY - fullMinY + 1;

  // 1. Export tight mark
  const lightImg = sharp(lightBuffer, { raw: { width, height, channels: 4 } });
  const darkImg = sharp(darkBuffer, { raw: { width, height, channels: 4 } });

  const tightMarkBuffer = await lightImg
    .clone()
    .extract({ left: markMinX, top: markMinY, width: markWidth, height: markHeight })
    .png()
    .toBuffer();

  await sharp(tightMarkBuffer).toFile(path.join(publicDir, 'zdrop-icon-tight.png'));

  // 2. Square mark with padding (for icons/favicons)
  const markSide = Math.max(markWidth, markHeight);
  const markPadX = Math.round((markSide - markWidth) / 2);
  const markPadY = Math.round((markSide - markHeight) / 2);
  const padding = Math.round(markSide * 0.1); // 10%

  const squareIconBuffer = await sharp(tightMarkBuffer)
    .extend({
      top: markPadY + padding,
      bottom: markSide - markHeight - markPadY + padding,
      left: markPadX + padding,
      right: markSide - markWidth - markPadX + padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  await sharp(squareIconBuffer).toFile(path.join(publicDir, 'zdrop-icon.png'));

  // 3. Full logos (Light & Dark)
  await lightImg
    .clone()
    .extract({ left: fullMinX, top: fullMinY, width: fullWidth, height: fullHeight })
    .png()
    .toFile(path.join(publicDir, 'zdrop-logo.png'));

  await darkImg
    .clone()
    .extract({ left: fullMinX, top: fullMinY, width: fullWidth, height: fullHeight })
    .png()
    .toFile(path.join(publicDir, 'zdrop-logo-dark.png'));

  // 4. Generate multi-resolution icons:
  const iconSizes = [16, 32, 48, 64, 128, 192, 512];
  const icoBuffers = [];

  for (const size of iconSizes) {
    const resized = await sharp(squareIconBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp(resized).toFile(path.join(publicDir, `icon-${size}.png`));

    if (size <= 48) {
      icoBuffers.push({ width: size, height: size, buffer: resized });
    }
  }

  // 5. Generate favicon.ico
  const icoData = createIcoBuffer(icoBuffers);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoData);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoData);

  // 6. Next.js App Router Favicon and Apple Icon
  const icon32 = await sharp(squareIconBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(appDir, 'icon.png'), icon32);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), icon32);

  const icon180 = await sharp(squareIconBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), icon180);
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), icon180);

  // 7. Base64 SVG Favicon
  const tightBase64 = tightMarkBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${markWidth} ${markHeight}">
  <image width="${markWidth}" height="${markHeight}" href="data:image/png;base64,${tightBase64}" />
</svg>`;
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

  console.log('All branding assets generated successfully!');
}

run().catch(console.error);
