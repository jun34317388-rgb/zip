// scratch/test_summary_text_cleaning.mjs
// 요약 텍스트 정제(Sanitizer) 및 가독성 E2E 검증 스크립트

function sanitizeSummaryBullet(raw) {
  if (!raw || typeof raw !== 'string') {
    return { category: 'general', categoryLabel: '', badgeClass: '', cleanText: '' };
  }

  let text = raw.trim();
  text = text.replace(/^[-*•\d.)\s]+/, '');
  text = text.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '');

  let category = 'general';
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

  text = text.replace(/^\[(?:핵심\s*정의|동작\s*원리|비교\s*및\s*주의점|비교|주의점)\]\s*:?\s*/i, '');
  text = text.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '');
  text = text.replace(/^[:\-–—\s]+/, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/([가-힣a-zA-Z0-9])\.([가-힣a-zA-Z])/g, '$1. $2');
  text = text.replace(/([가-힣a-zA-Z0-9]),([가-힣a-zA-Z])/g, '$1, $2');
  text = text.replace(/\s{2,}/g, ' ').trim();

  return { category, categoryLabel, badgeClass, cleanText: text };
}

function sanitizeBulletList(bullets) {
  return bullets.map(sanitizeSummaryBullet).filter((b) => b.cleanText.length > 5);
}

async function testCleaning() {
  console.log('================================================================');
  console.log('✨ [Sprint 17 & 18] 요약 텍스트 정제(Sanitizer) 및 가독성 E2E 검증');
  console.log('================================================================\n');

  // 1. 노이즈가 포함된 테스트 데이터 정제 단위 검증
  const noisySamples = [
    '- 💡 [핵심 정의]   "프로세스는   메모리에  적재되어 실행 중인 프로그램 인스턴스입니다."',
    '* ⚙️ [동작 원리] `Context Switch` 발생 시.현재 레지스터를 PCB에 저장하고,다음 프로세스를 복원합니다.',
    '1. - ⚖️ [비교 및 주의점]   문맥  교환 빈도가 지나치게 높으면 시스템 오버헤드가 급증합니다.주의가 필요합니다.   ',
    '일반 요약 문장으로 다중    공백이   들어간   경우입니다.',
  ];

  console.log('1️⃣ [단위 검증] 노이즈 샘플 정제 테스트 진행 중...');
  const cleaned = sanitizeBulletList(noisySamples);

  cleaned.forEach((item, idx) => {
    console.log(`\n   [Sample ${idx + 1}]`);
    console.log(`      • 원본: ${noisySamples[idx]}`);
    console.log(`      • 카테고리: [${item.categoryLabel || '일반'}] (${item.category})`);
    console.log(`      • 정제된 텍스트: "${item.cleanText}"`);
    
    if (item.cleanText.includes('  ')) {
      throw new Error(`다중 공백이 남아있습니다: ${item.cleanText}`);
    }
    if (item.cleanText.startsWith('"') || item.cleanText.startsWith('`')) {
      throw new Error(`따옴표/백틱이 남아있습니다: ${item.cleanText}`);
    }
  });

  // 2. 실제 서버 API 요약 정제 E2E 검증
  console.log('\n2️⃣ [E2E 검증] POST http://localhost:3000/api/ai/summary 요청 중...');
  const res = await fetch('http://localhost:3000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: '운영체제 프로세스 관리 및 CPU 스케줄링 이론에 대한 핵심 내용입니다. PCB와 Context Switching을 다룹니다.',
      title: '운영체제 프로세스 관리',
    }),
  });

  if (!res.ok) throw new Error(`Summary API failed: ${res.status}`);
  const data = await res.json();
  console.log(`   ✅ 수신된 요약 불릿 수: ${data.bullets.length}개`);

  const serverCleaned = sanitizeBulletList(data.bullets);
  serverCleaned.slice(0, 3).forEach((item) => {
    console.log(`      [${item.categoryLabel}] ${item.cleanText}`);
  });

  console.log('\n================================================================');
  console.log('🎉 [Sprint 17 & 18] 요약 텍스트 정제 및 가독성 검증 100% 통과 (PASS)');
  console.log('================================================================\n');
}

testCleaning().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
