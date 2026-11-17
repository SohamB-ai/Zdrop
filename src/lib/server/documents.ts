import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { dirname, join, sep } from 'node:path';

export class DocumentError extends Error {}

export interface DocumentInspection {
  pageCount: number;
  colorPages?: number[];
  bwPages?: number[];
}

// Render at a bounded resolution and ignore very small RGB differences from
// antialiasing and compression. Transparency is composited onto white paper.
function hasColour(pixels: Uint8ClampedArray) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) >= 15) return true;
  }
  return false;
}

async function inspectPdfColour(bytes: Uint8Array): Promise<DocumentInspection> {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { getDocument, VerbosityLevel } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const resolve = process.getBuiltinModule('module')!.createRequire(join(process.cwd(), 'package.json')).resolve;
  const assets = dirname(resolve('pdfjs-dist/package.json'));
  const task = getDocument({
    data: Uint8Array.from(bytes),
    cMapUrl: join(assets, 'cmaps') + sep,
    standardFontDataUrl: join(assets, 'standard_fonts') + sep,
    wasmUrl: join(assets, 'wasm') + sep,
    verbosity: VerbosityLevel.ERRORS,
  });

  try {
    const pdf = await task.promise;
    const colorPages: number[] = [];
    const bwPages: number[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(1, 1024 / Math.max(size.width, size.height)) });
      const canvas = createCanvas(Math.max(1, Math.ceil(viewport.width)), Math.max(1, Math.ceil(viewport.height)));
      try {
        // PDF.js accepts the Node canvas implementation at runtime.
        await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport, intent: 'print' }).promise;
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        (hasColour(pixels) ? colorPages : bwPages).push(number);
      } finally {
        page.cleanup();
        canvas.width = canvas.height = 1;
      }
    }
    return { pageCount: pdf.numPages, colorPages, bwPages };
  } finally {
    await task.destroy();
  }
}

export async function inspectDocument(
  bytes: Uint8Array,
  type: string,
  detectColour = true,
): Promise<DocumentInspection | undefined> {
  if (type === 'application/pdf') {
    try {
      if (detectColour) return await inspectPdfColour(bytes);
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      const pageCount = pdf.getPageCount();
      if (!pageCount) throw new Error();
      return { pageCount };
    } catch {
      throw new DocumentError('This PDF could not be read. Upload a valid, unlocked PDF.');
    }
  }

  if (type.includes('wordprocessing')) {
    try {
      const zip = await JSZip.loadAsync(bytes);
      if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) throw new Error();
      return undefined;
    } catch {
      throw new DocumentError('This file is not a valid DOCX document.');
    }
  }

  const valid = type === 'image/png'
    ? bytes.length >= 24 && Buffer.from(bytes.slice(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : type === 'image/jpeg' && bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;

  if (!valid) throw new DocumentError('The image is invalid or does not match its format.');
  if (!detectColour) return { pageCount: 1 };
  try {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas');
    const image = await loadImage(Buffer.from(bytes));
    const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
    const canvas = createCanvas(Math.max(1, Math.ceil(image.width * scale)), Math.max(1, Math.ceil(image.height * scale)));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return hasColour(context.getImageData(0, 0, canvas.width, canvas.height).data)
      ? { pageCount: 1, colorPages: [1], bwPages: [] }
      : { pageCount: 1, colorPages: [], bwPages: [1] };
  } catch {
    throw new DocumentError('This image could not be read. Upload a valid JPG or PNG.');
  }
}
