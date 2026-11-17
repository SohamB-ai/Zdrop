import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';
import JSZip from 'jszip';
import zlib from 'node:zlib';

export class DocumentError extends Error {}

export interface DocumentInspection {
  pageCount: number;
  colorPages?: number[];
  bwPages?: number[];
}

export async function inspectDocument(bytes: Uint8Array, type: string): Promise<DocumentInspection | undefined> {
  if (type === 'application/pdf') {
    try {
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      const totalPages = pdf.getPageCount();
      if (!totalPages) throw new Error();

      const colorPages: number[] = [];
      const bwPages: number[] = [];

      for (let i = 0; i < totalPages; i++) {
        const pageNum = i + 1;
        const page = pdf.getPage(i);
        let isColor = false;

        // 1. Check for /XObject images in Resources
        const resources = page.node.Resources();
        if (resources) {
          const xObject = resources.get(PDFName.of('XObject'));
          if (xObject instanceof PDFDict) {
            for (const [_, ref] of xObject.entries()) {
              const obj = pdf.context.lookup(ref);
              const dict = obj instanceof PDFDict ? obj : (obj && (obj as any).dict ? (obj as any).dict : null);
              if (dict) {
                const subtype = dict.get(PDFName.of('Subtype'));
                if (subtype && subtype.toString() === '/Image') {
                  isColor = true;
                  break;
                }
              }
            }
          }
        }

        // 2. Check content streams for non-grayscale color operators or inline images
        if (!isColor) {
          const contents = page.node.Contents();
          if (contents) {
            const resolved = pdf.context.lookup(contents);
            const streamArray = resolved instanceof PDFArray ? resolved.asArray() : [contents];
            for (const ref of streamArray) {
              const s = pdf.context.lookup(ref);
              if (s && (s as any).getContents) {
                const rawBytes = (s as any).getContents();
                let text = '';
                try {
                  text = zlib.inflateSync(rawBytes).toString('latin1');
                } catch {
                  text = Buffer.from(rawBytes).toString('latin1');
                }

                // Check inline images: BI ... ID ... EI
                if (/\bBI\b[\s\S]*?\bID\b[\s\S]*?\bEI\b/.test(text)) {
                  isColor = true;
                  break;
                }

                // Check RGB operators: r g b rg / RG
                const rgbMatches = [...text.matchAll(/([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+[rR][gG]/g)];
                const hasColorRgb = rgbMatches.some(m => {
                  const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
                  return Math.abs(r - g) > 0.05 || Math.abs(g - b) > 0.05 || Math.abs(r - b) > 0.05;
                });
                if (hasColorRgb) {
                  isColor = true;
                  break;
                }

                // Check CMYK color operators
                const cmykMatches = [...text.matchAll(/([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+[kK]/g)];
                const hasColorCmyk = cmykMatches.some(m => {
                  const c = Number(m[1]), mVal = Number(m[2]), y = Number(m[3]);
                  return c > 0.05 || mVal > 0.05 || y > 0.05;
                });
                if (hasColorCmyk) {
                  isColor = true;
                  break;
                }
              }
            }
          }
        }

        if (isColor) {
          colorPages.push(pageNum);
        } else {
          bwPages.push(pageNum);
        }
      }

      return { pageCount: totalPages, colorPages, bwPages };
    } catch {
      throw new DocumentError('This PDF is invalid or password protected. Upload an unlocked PDF.');
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
  return { pageCount: 1, colorPages: [1], bwPages: [] };
}
