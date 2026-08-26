import { ExceptionKey, PDFExtractResult } from '@/lib/types';
import { validateExtractedText, validateFilePreUpload } from './validator';

export interface ExtractOutcome {
  success: boolean;
  data?: PDFExtractResult;
  errorKey: ExceptionKey;
}

/**
 * PDF 파일의 매직 넘버(%PDF-) 검사
 */
export function verifyPdfMagicNumber(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 5) return false;
  const header = new Uint8Array(buffer.slice(0, 5));
  // %PDF- => 0x25, 0x50, 0x44, 0x46, 0x2D
  return (
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d
  );
}

/**
 * PDF 파일에서 텍스트 레이어를 추출하고 유효성을 검증하는 핵심 엔진
 */
export async function extractTextFromPDF(file: File): Promise<ExtractOutcome> {
  // 1. 사전 파일 유효성 검사 (5.1, 5.2, 5.3)
  const preCheck = validateFilePreUpload(file);
  if (!preCheck.isValid) {
    return { success: false, errorKey: preCheck.errorKey };
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    return { success: false, errorKey: 'CORRUPTED_PDF' };
  }

  // 2. 파일 시그니처(%PDF-) 검사 (5.2 확장자 위조/손상 방어)
  if (!verifyPdfMagicNumber(arrayBuffer)) {
    return { success: false, errorKey: 'CORRUPTED_PDF' };
  }

  // 3. PDF.js 파서 로드 및 파싱 (5.2 파서 예외 캐치)
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Worker configuration for browser environment
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    const pages: { pageNumber: number; text: string }[] = [];
    const textPieces: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({ pageNumber: pageNum, text: pageText });
      if (pageText) {
        textPieces.push(pageText);
      }
    }

    const fullText = textPieces.join('\n\n');

    // 4. 사후 유효성 검사 (5.3 과다 페이지, 5.4 스캔본/텍스트 미달 검증)
    const postCheck = validateExtractedText(fullText, pageCount);
    if (!postCheck.isValid) {
      return { success: false, errorKey: postCheck.errorKey };
    }

    return {
      success: true,
      errorKey: 'none',
      data: {
        fileName: file.name,
        fileSizeBytes: file.size,
        pageCount,
        totalCharacters: fullText.length,
        pages,
        fullText,
      },
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return { success: false, errorKey: 'CORRUPTED_PDF' };
  }
}
