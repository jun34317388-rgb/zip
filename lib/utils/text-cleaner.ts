/**
 * 요약 텍스트 정제 및 노이즈 제거 유틸리티
 */

export interface SanitizedBullet {
  category: 'definition' | 'mechanism' | 'tradeoff' | 'general';
  categoryLabel: string;
  badgeClass: string;
  cleanText: string;
}

/**
 * 원시 요약 불릿 텍스트를 깨끗하게 정제하고 카테고리 태그를 분리합니다.
 */
export function sanitizeSummaryBullet(raw: string): SanitizedBullet {
  if (!raw || typeof raw !== 'string') {
    return {
      category: 'general',
      categoryLabel: '',
      badgeClass: '',
      cleanText: '',
    };
  }

  // 1. 앞뒤 공백 및 마크다운 기호/불릿 기호 1차 박리
  let text = raw.trim();
  text = text.replace(/^[-*•\d.)\s]+/, ''); // '- ', '1. ', '• ' 등 제거
  text = text.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, ''); // 앞뒤 따옴표/백틱 제거

  // 2. 카테고리 태그 감지 및 분류
  let category: SanitizedBullet['category'] = 'general';
  let categoryLabel = '';
  let badgeClass = '';

  const isDef = /💡|\[(?:핵심\s*정의|핵심\s*개념|개념\s*정의|정의)\]/i.test(text);
  const isMech = /⚙️|\[(?:동작\s*원리|동작\s*메커니즘|메커니즘|수행\s*절차)\]/i.test(text);
  const isTrade = /⚖️|\[(?:비교\s*및\s*주의점|비교\s*분석|트레이드오프|비교|주의점|주의사항)\]/i.test(text);

  if (isDef) {
    category = 'definition';
    categoryLabel = '핵심 정의';
    badgeClass = 'bg-primary/10 text-primary border border-primary/20';
    text = text.replace(/^.*?(?:💡|\[(?:핵심\s*정의|핵심\s*개념|개념\s*정의|정의)\])\s*:?\s*/i, '');
  } else if (isMech) {
    category = 'mechanism';
    categoryLabel = '동작 메커니즘';
    badgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    text = text.replace(/^.*?(?:⚙️|\[(?:동작\s*원리|동작\s*메커니즘|메커니즘|수행\s*절차)\])\s*:?\s*/i, '');
  } else if (isTrade) {
    category = 'tradeoff';
    categoryLabel = '비교 · 분석';
    badgeClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
    text = text.replace(/^.*?(?:⚖️|\[(?:비교\s*및\s*주의점|비교\s*분석|트레이드오프|비교|주의점|주의사항)\])\s*:?\s*/i, '');
  }

  // 3. 잔여 특수기호 및 백틱/따옴표 완전 박리
  text = text.replace(/[`"'“”‘’]+/g, ''); // 문장 내 잔여 백틱 및 따옴표 제거
  text = text.replace(/^[:\-–—\s]+/, ''); // 시작 부분의 콜론, 대시 제거
  text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // 볼드 마크다운 문법 정리 (순수 텍스트화)

  // 4. 구두점 뒤 공백 누락 정규화 (예: '다.다음' -> '다. 다음', '다,그리고' -> '다, 그리고')
  text = text.replace(/([가-힣a-zA-Z0-9])\.([가-힣a-zA-Z])/g, '$1. $2');
  text = text.replace(/([가-힣a-zA-Z0-9]),([가-힣a-zA-Z])/g, '$1, $2');

  // 5. 연속된 다중 공백 단일화
  text = text.replace(/\s{2,}/g, ' ').trim();

  return {
    category,
    categoryLabel,
    badgeClass,
    cleanText: text,
  };
}

/**
 * 불릿 목록 전체를 일괄 정제하는 헬퍼 함수
 */
export function sanitizeBulletList(bullets: string[]): SanitizedBullet[] {
  return bullets
    .map(sanitizeSummaryBullet)
    .filter((b) => b.cleanText.length > 5);
}
