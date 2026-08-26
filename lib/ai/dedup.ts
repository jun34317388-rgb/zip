import { QuizItem } from '@/lib/types';

/**
 * 텍스트 정규화 (공백, 특수문자 제거 및 소문자화)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 자카드(Jaccard) N-gram 기반 한국어/영어 문장 유사도 계산 (0.0 ~ 1.0)
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  // 2-gram 단어/문자 셋 생성
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const setA = getBigrams(normA);
  const setB = getBigrams(normB);

  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 신규 문항 목록 중 기존 문항들과 중복되는 문항을 판별하고 필터링
 * (유사도 0.70 이상인 경우 중복으로 판정)
 */
export function filterDuplicateQuizzes(
  newQuizzes: QuizItem[],
  existingQuestions: string[],
  similarityThreshold = 0.70
): { validQuizzes: QuizItem[]; duplicateCount: number } {
  const validQuizzes: QuizItem[] = [];
  let duplicateCount = 0;

  for (const quiz of newQuizzes) {
    const isDuplicate = existingQuestions.some((existingQ) => {
      const similarity = calculateTextSimilarity(quiz.question, existingQ);
      return similarity >= similarityThreshold;
    });

    if (isDuplicate) {
      duplicateCount++;
    } else {
      validQuizzes.push(quiz);
      // 같은 응답 내에서도 중복 방지
      existingQuestions.push(quiz.question);
    }
  }

  return { validQuizzes, duplicateCount };
}
