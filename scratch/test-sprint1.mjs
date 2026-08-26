import { validateFilePreUpload, validateExtractedText } from '../lib/pdf/validator.ts';
import { verifyPdfMagicNumber } from '../lib/pdf/extractor.ts';

function runTests() {
  console.log('=== Sprint 1 PDF Validation & Extraction Tests ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Test 5.1: Empty / null / 0 byte
  assert(validateFilePreUpload(null).errorKey === 'EMPTY_FILE', '5.1 null file returns EMPTY_FILE');
  assert(validateFilePreUpload(undefined).errorKey === 'EMPTY_FILE', '5.1 undefined file returns EMPTY_FILE');
  assert(validateFilePreUpload({ name: 'test.pdf', size: 0, type: 'application/pdf' }).errorKey === 'EMPTY_FILE', '5.1 0-byte file returns EMPTY_FILE');

  // 2. Test 5.2: Invalid extension or MIME
  assert(validateFilePreUpload({ name: 'lecture.docx', size: 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }).errorKey === 'INVALID_FILE_TYPE', '5.2 .docx returns INVALID_FILE_TYPE');
  assert(validateFilePreUpload({ name: 'image.png', size: 1024, type: 'image/png' }).errorKey === 'INVALID_FILE_TYPE', '5.2 .png returns INVALID_FILE_TYPE');
  assert(validateFilePreUpload({ name: 'notes.txt', size: 1024, type: 'text/plain' }).errorKey === 'INVALID_FILE_TYPE', '5.2 .txt returns INVALID_FILE_TYPE');

  // 3. Test 5.3: File too large (> 20MB)
  assert(validateFilePreUpload({ name: 'huge.pdf', size: 21 * 1024 * 1024, type: 'application/pdf' }).errorKey === 'FILE_TOO_LARGE', '5.3 > 20MB file returns FILE_TOO_LARGE');

  // 4. Test 5.3: Too many pages (> 100 pages)
  assert(validateExtractedText('Some long valid text '.repeat(10), 101).errorKey === 'FILE_TOO_LARGE', '5.3 > 100 pages returns FILE_TOO_LARGE');

  // 5. Test 5.4: Scanned / No text (< 50 chars)
  assert(validateExtractedText('', 10).errorKey === 'NO_TEXT_EXTRACTED', '5.4 empty text returns NO_TEXT_EXTRACTED');
  assert(validateExtractedText('   \n  \t  ', 5).errorKey === 'NO_TEXT_EXTRACTED', '5.4 whitespace only returns NO_TEXT_EXTRACTED');
  assert(validateExtractedText('Short text', 1).errorKey === 'NO_TEXT_EXTRACTED', '5.4 < 50 chars returns NO_TEXT_EXTRACTED');

  // 6. Test Valid text
  const validText = '데이터베이스는 여러 사용자가 공유하는 구조화된 데이터를 효율적으로 저장하고 검색하기 위한 시스템이다. 파일 시스템의 중복성과 일관성 문제를 해결하며, 데이터와 이를 관리하는 소프트웨어를 함께 포함한다.';
  assert(validateExtractedText(validText, 10).errorKey === 'none', 'Valid text returns none error');

  // 7. Test Magic Number Check
  const validPdfHeader = new TextEncoder().encode('%PDF-1.7\n%abc').buffer;
  const invalidHeader = new TextEncoder().encode('GIF89a\n').buffer;
  assert(verifyPdfMagicNumber(validPdfHeader) === true, 'Magic number detects %PDF-');
  assert(verifyPdfMagicNumber(invalidHeader) === false, 'Magic number rejects non-PDF');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
