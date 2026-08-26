import { ExceptionKey } from '@/lib/types';

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_PAGE_COUNT = 100; // 100 pages upper limit
export const MIN_EXTRACTED_CHAR_COUNT = 50; // Minimum meaningful character count

export interface ValidationResult {
  isValid: boolean;
  errorKey: ExceptionKey;
}

/**
 * 5.1, 5.2, 5.3: 사전 파일 유효성 검사
 */
export function validateFilePreUpload(file: File | null | undefined): ValidationResult {
  // 5.1 파일 미선택 또는 0바이트 파일
  if (!file || file.size === 0) {
    return { isValid: false, errorKey: 'EMPTY_FILE' };
  }

  // 5.2 파일 확장자 및 MIME 타입 검증
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';
  if (!isPdfExtension || (!isPdfMime && file.type)) {
    return { isValid: false, errorKey: 'INVALID_FILE_TYPE' };
  }

  // 5.3 파일 용량 상한 검사 (20MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, errorKey: 'FILE_TOO_LARGE' };
  }

  return { isValid: true, errorKey: 'none' };
}

/**
 * 5.3, 5.4: 텍스트 추출 후 결과 유효성 검사 (페이지 수 초과, 스캔본/이미지 판별)
 */
export function validateExtractedText(fullText: string, pageCount: number): ValidationResult {
  // 5.3 과다 페이지 수 초과 검사
  if (pageCount > MAX_PAGE_COUNT) {
    return { isValid: false, errorKey: 'FILE_TOO_LARGE' };
  }

  // 5.4 텍스트 레이어 미존재(스캔본/이미지 PDF) 검사
  const meaningfulChars = fullText.replace(/\s+/g, '');
  if (meaningfulChars.length < MIN_EXTRACTED_CHAR_COUNT) {
    return { isValid: false, errorKey: 'NO_TEXT_EXTRACTED' };
  }

  return { isValid: true, errorKey: 'none' };
}
