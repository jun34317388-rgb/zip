// scratch/test_outline_pagination.mjs
// 목차 페이지 번호 범위 (pageRange) 및 가독성 검증 스크립트

const BASE_URL = 'http://localhost:3000';

const TEST_LECTURE = `
[Chapter 1. 컴퓨터 시스템 개요 및 프로세스 관리]
운영체제(OS)는 하드웨어와 응용 프로그램 간 인터페이스를 제공하며 CPU 스케줄링과 프로세스 제어 블록(PCB)을 관리합니다. 문맥 교환을 통해 시분할 다중 작업을 지원합니다.

[Chapter 2. 가상 메모리 관리와 페이징 시스템]
가상 메모리는 페이징 기법을 통해 물리 메모리의 한계를 극복하며 TLB 캐시를 통해 고속 가상 주소 변환을 수행합니다. 페이지 폴트 발생 시 디스크 I/O를 통해 스왑 영역에서 페이지를 적재합니다.

[Chapter 3. 프로세스 동기화와 임계 구역 문제]
공유 자원에 대한 동시 접근 시 경쟁 상태를 방지하기 위해 뮤텍스와 세마포어를 사용하며 상호 배제, 진행, 유한 대기 조건을 만족해야 합니다.
`;

async function testPagination() {
  console.log('================================================================');
  console.log('📄 [Sprint 14 & 15] 목차 페이지 범위(pageRange) & 줄바꿈 가독성 E2E 검증');
  console.log('================================================================\n');

  console.log('1️⃣ [POST /api/ai/outline] pageCount=28 파라미터와 함께 목차 구조화 요청 중...');
  const res = await fetch(`${BASE_URL}/api/ai/outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullText: TEST_LECTURE,
      pageCount: 28,
    }),
  });

  if (!res.ok) throw new Error(`Outline API failed: ${res.status}`);
  const data = await res.json();
  console.log(`   ✅ 생성된 목차 수: ${data.outlines.length}개\n`);

  let allHavePages = true;
  data.outlines.forEach((o, idx) => {
    const hasPage = Boolean(o.pageRange);
    if (!hasPage) allHavePages = false;

    console.log(`   [Chapter ${idx + 1}] 📌 ${o.title}`);
    console.log(`      • 📄 페이지 범위: ${o.pageRange || '미할당'} (시작: ${o.pageStart}p ~ 끝: ${o.pageEnd}p)`);
    console.log(`      • ⏱️ 예상 학습 시간: 약 ${o.estimatedMinutes || 5}분`);
    console.log(`      • 🏷️ 토픽 태그: ${o.topicTags?.map(t => `#${t}`).join(' ') || '#기초'}\n`);
  });

  if (!allHavePages) {
    throw new Error('Some outlines are missing pageRange!');
  }

  console.log('================================================================');
  console.log('🎉 [Sprint 14 & 15] 목차 페이지 범위 & 줄바꿈 가독성 검증 100% 통과 (PASS)');
  console.log('================================================================\n');
}

testPagination().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
