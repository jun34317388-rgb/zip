export type View = 'upload' | 'outline' | 'detail';

export type ExceptionKey =
  | 'none'
  | 'EMPTY_FILE'         // 5.1 업로드할 PDF 파일을 먼저 선택해주세요.
  | 'INVALID_FILE_TYPE'  // 5.2 PDF 파일만 업로드할 수 있어요. 파일 형식을 확인해주세요.
  | 'CORRUPTED_PDF'      // 5.2 PDF 파일을 열 수 없어요. 파일이 손상되지 않았는지 확인해주세요.
  | 'FILE_TOO_LARGE'     // 5.3 파일 용량이 너무 커서 처리할 수 없어요. 더 작은 파일이나 일부 페이지만 포함된 PDF로 다시 시도해주세요.
  | 'NO_TEXT_EXTRACTED'  // 5.4 이 PDF에서는 텍스트를 추출할 수 없어요. 스캔된 이미지 PDF는 지원하지 않으며, 텍스트가 포함된 PDF만 처리할 수 있어요.
  | 'AI_FAILED_OUTLINE'  // 5.5 목차를 분석하는 중 문제가 발생했어요. 다시 시도해주세요.
  | 'AI_FAILED_SUMMARY'  // 5.5 요약을 생성하지 못했어요. 다시 시도해주세요.
  | 'AI_FAILED_QUIZ'     // 5.5 퀴즈를 만들지 못했어요. 다시 시도해주세요.
  | 'AI_TIMEOUT'         // 5.6 응답이 너무 오래 걸려 처리를 중단했어요. 다시 시도해주세요.
  | 'AI_INVALID_FORMAT'  // 5.7 결과를 정리하는 중 문제가 발생했어요. 다시 시도해주세요.
  | 'NO_OUTLINE_FOUND'   // 5.7 이 강의자료의 목차를 인식하지 못했어요. 다른 파일로 시도해보시거나 다시 시도해주세요.
  | 'QUIZ_MORE_FAILED'   // 5.8 새로운 문제를 만들지 못했어요. 잠시 후 다시 시도해주세요.
  | 'NETWORK_ERROR';     // 5.9 네트워크 연결을 확인해주세요. 연결이 끊어져 요청을 완료하지 못했어요.

export const PRD_ERROR_MESSAGES: Record<Exclude<ExceptionKey, 'none'>, string> = {
  EMPTY_FILE: '업로드할 PDF 파일을 먼저 선택해주세요.',
  INVALID_FILE_TYPE: 'PDF 파일만 업로드할 수 있어요. 파일 형식을 확인해주세요.',
  CORRUPTED_PDF: 'PDF 파일을 열 수 없어요. 파일이 손상되지 않았는지 확인해주세요.',
  FILE_TOO_LARGE: '파일 용량이 너무 커서 처리할 수 없어요. 더 작은 파일이나 일부 페이지만 포함된 PDF로 다시 시도해주세요.',
  NO_TEXT_EXTRACTED: '이 PDF에서는 텍스트를 추출할 수 없어요. 스캔된 이미지 PDF는 지원하지 않으며, 텍스트가 포함된 PDF만 처리할 수 있어요.',
  AI_FAILED_OUTLINE: '목차를 분석하는 중 문제가 발생했어요. 다시 시도해주세요.',
  AI_FAILED_SUMMARY: '요약을 생성하지 못했어요. 다시 시도해주세요.',
  AI_FAILED_QUIZ: '퀴즈를 만들지 못했어요. 다시 시도해주세요.',
  AI_TIMEOUT: '응답이 너무 오래 걸려 처리를 중단했어요. 다시 시도해주세요.',
  AI_INVALID_FORMAT: '결과를 정리하는 중 문제가 발생했어요. 다시 시도해주세요.',
  NO_OUTLINE_FOUND: '이 강의자료의 목차를 인식하지 못했어요. 다른 파일로 시도해보시거나 다시 시도해주세요.',
  QUIZ_MORE_FAILED: '새로운 문제를 만들지 못했어요. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요. 연결이 끊어져 요청을 완료하지 못했어요.',
};

export interface PDFExtractResult {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  totalCharacters: number;
  pages: { pageNumber: number; text: string }[];
  fullText: string;
}

export interface OutlineItem {
  id: string;
  order: number;
  title: string;
  contentSlice: string;
}

export type QuizDifficulty = 'basic' | 'advanced';

export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty?: QuizDifficulty;
}

export interface TopicDetailCache {
  summary?: string[];
  quizzes: QuizItem[];
  userAnswers: Record<number, number>;
  advancedQuizzes?: QuizItem[];
  advancedAnswers?: Record<number, number>;
}

