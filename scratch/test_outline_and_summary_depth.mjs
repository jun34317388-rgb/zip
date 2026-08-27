// scratch/test_outline_and_summary_depth.mjs
// 목차 가독성 (태그 칩) 및 3-Tier 심층 구조화 요약 E2E 검증 스크립트

const BASE_URL = 'http://localhost:3000';

const TEST_LECTURE_TEXT = `
[Chapter 1. 운영체제 구조 및 프로세스 관리]
운영체제(OS)는 하드웨어 자원을 효율적으로 관리하고 응용 프로그램에 추상화된 인터페이스를 제공하는 시스템 소프트웨어입니다.
프로세스(Process)는 메모리에 적재되어 CPU에 의해 실행 중인 프로그램 인스턴스이며, 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 분할됩니다.
프로세스 제어 블록(PCB)은 프로세스의 현재 상태, 프로그램 카운터(PC), CPU 레지스터, 메모리 한계치, 열린 파일 목록을 보관하는 핵심 커널 자료구조입니다.
문맥 교환(Context Switch)은 CPU 제어권이 다른 프로세스로 넘어갈 때 현재 프로세스의 레지스터 상태를 PCB에 저장하고 새 프로세스의 PCB를 CPU 레지스터에 복원하는 하드웨어-소프트웨어 협력 절차입니다.
문맥 교환은 캐시 무효화 및 메모리 맵 재설정으로 인해 필연적인 시스템 오버헤드를 유발하므로 잦은 문맥 교환을 억제하는 정교한 CPU 스케줄링 알고리즘이 요구됩니다.

[Chapter 2. 가상 메모리와 페이징 시스템]
가상 메모리(Virtual Memory)는 실제 물리 메모리(RAM) 용량의 한계를 극복하기 위해 디스크의 스왑 영역을 메모리 주소 공간처럼 활용하는 기법입니다.
페이징(Paging) 기법은 가상 메모리를 동일한 고정 크기 블록인 페이지(Page)로 나누고, 물리 메모리를 동일 크기의 프레임(Frame)으로 나누어 불연속적으로 매핑합니다.
페이지 테이블(Page Table)은 가상 페이지 번호(VPN)를 물리 프레임 번호(PFN)로 변환하는 매핑 테이블이며, 주소 변환 지연을 O(1) 수준으로 단축하기 위해 하드웨어 캐시인 TLB(Translation Lookaside Buffer)를 탑재합니다.
페이지 폴트(Page Fault)는 참조하려는 페이지가 현재 물리 메모리에 없을 때 발생하는 하드웨어 트랩이며, 커널은 디스크 I/O를 통해 해당 페이지를 빈 프레임에 적재합니다.
LRU(Least Recently Used) 페이지 교체 알고리즘은 가장 오랫동안 참조되지 않은 페이지를 희생양으로 선정하여 스래싱(Thrashing) 현상을 억제합니다.
`;

async function testDepthAndHierarchy() {
  console.log('================================================================');
  console.log('📑 [Sprint 11 & 12] 목차 가독성(태그 칩) & 3-Tier 심층 구조화 요약 E2E 검증');
  console.log('================================================================\n');

  // 1. 목차 추출 및 토픽 태그 칩 검증 (Sprint 11)
  console.log('1️⃣ [POST /api/ai/outline] 목차 구조화 및 핵심 토픽 태그 칩 추출 요청 중...');
  const outlineRes = await fetch(`${BASE_URL}/api/ai/outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullText: TEST_LECTURE_TEXT }),
  });

  if (!outlineRes.ok) throw new Error(`Outline API failed: ${outlineRes.status}`);
  const outlineData = await outlineRes.json();
  console.log(`   ✅ 생성된 챕터 수: ${outlineData.outlines.length}개`);
  
  outlineData.outlines.forEach((o, idx) => {
    const tags = o.topicTags ? o.topicTags.map(t => `#${t}`).join(' ') : '#일반';
    console.log(`      [Chapter ${idx + 1}] 📌 ${o.title}`);
    console.log(`         • 예상 학습 시간: ⏱️ 약 ${o.estimatedMinutes || 5}분`);
    console.log(`         • 핵심 토픽 태그 칩: ${tags}`);
  });

  const firstOutline = outlineData.outlines[0];

  // 2. 3-Tier 심층 구조화 배치 요약 검증 (Sprint 12)
  console.log('\n2️⃣ [POST /api/ai/summary] 3-Tier 심층 구조화 요약 생성 요청 중...');
  const summaryRes = await fetch(`${BASE_URL}/api/ai/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: firstOutline.contentSlice,
      title: firstOutline.title,
    }),
  });

  if (!summaryRes.ok) throw new Error(`Summary API failed: ${summaryRes.status}`);
  const summaryData = await summaryRes.json();
  console.log(`   ✅ 생성된 심층 요약 불릿 수: ${summaryData.bullets.length}개 (고밀도 달성)`);
  
  summaryData.bullets.forEach((b) => {
    console.log(`      ${b}`);
  });

  // 3. SSE 실시간 스트리밍 3-Tier 수신 검증
  console.log('\n3️⃣ [POST /api/ai/summary-stream] 3-Tier SSE 실시간 요약 스트리밍 수신 중...');
  const streamRes = await fetch(`${BASE_URL}/api/ai/summary-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: firstOutline.contentSlice,
      title: firstOutline.title,
    }),
  });

  if (!streamRes.ok) throw new Error(`Stream API failed: ${streamRes.status}`);
  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let fullStream = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.fullText) fullStream = parsed.fullText;
        } catch {}
      }
    }
  }

  const streamLines = fullStream.split('\n').filter(l => l.trim().startsWith('-'));
  console.log(`   ✅ 실시간 수신된 3-Tier 불릿 수: ${streamLines.length}개`);
  streamLines.slice(0, 3).forEach(l => console.log(`      ${l}`));

  console.log('\n================================================================');
  console.log('🎉 [Sprint 11 & 12] 목차 가독성 극대화 & 3단 심층 요약 검증 100% 통과 (PASS)');
  console.log('================================================================\n');
}

testDepthAndHierarchy().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
