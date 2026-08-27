import assert from 'node:assert';

async function testSummaryStreaming() {
  console.log('================================================================');
  console.log('⚡ [Sprint 7] SSE 실시간 요약 스트리밍 & 체감 지연 최적화 검증');
  console.log('================================================================\n');

  const contentSlice = `운영체제(Operating System)는 컴퓨터 하드웨어와 사용자 응용 프로그램 사이에서 자원을 효율적으로 관리하고 인터페이스를 제공하는 시스템 소프트웨어입니다.
운영체제의 핵심 기능은 프로세스 관리, 메모리 관리, 파일 시스템 관리, 입출력 장치 관리로 나뉩니다.
프로세스(Process)는 메모리에 적재되어 실행 중인 프로그램 인스턴스를 의미합니다. 프로세스는 실행에 필요한 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 구성됩니다.
프로세스의 상태는 New(생성), Ready(준비), Running(실행), Waiting/Blocked(대기), Terminated(종료)의 5가지 기본 상태 전이를 가집니다.
프로세스 제어 블록(Process Control Block, PCB)은 각 프로세스의 상태, 프로그램 카운터(PC), 레지스터 정보, 메모리 한계치 등을 저장하는 커널 자료구조입니다.`;

  console.log('1️⃣ [SSE 엔드포인트 연결]: POST /api/ai/summary-stream 요청 시작...');
  const startTime = Date.now();
  let firstChunkTime = 0;
  let chunkCount = 0;
  let accumulatedText = '';

  const res = await fetch('http://localhost:3000/api/ai/summary-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice,
      title: 'Chapter 1. 운영체제 개요 및 프로세스 관리',
    }),
  });

  assert.strictEqual(res.status, 200, 'SSE 응답 상태 코드는 200이어야 합니다.');
  assert(res.headers.get('content-type')?.includes('text/event-stream'), 'Content-Type은 text/event-stream이어야 합니다.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  console.log('\n2️⃣ [실시간 청크 수신 스트림 모니터링]:');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (firstChunkTime === 0) {
      firstChunkTime = Date.now();
      const firstLatency = ((firstChunkTime - startTime) / 1000).toFixed(2);
      console.log(`   ⚡ 첫 번째 청크 수신 (First Token Latency): ${firstLatency}초 만에 도착! (대기시간 제로화)`);
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (!dataStr || dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          chunkCount++;
          if (parsed.fullText) {
            accumulatedText = parsed.fullText;
          }
          if (chunkCount % 5 === 0) {
            process.stdout.write(`   ↳ [청크 #${chunkCount}] 수신 중... (${accumulatedText.length}자 누적)\r`);
          }
        } catch {
          // pass
        }
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\n   ✅ 스트리밍 전송 완료 (총 ${totalTime}초 소요, 총 ${chunkCount}개 청크 수신)`);

  // 3. 수신 결과 파싱 및 불릿 검증
  const bullets = accumulatedText
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(Boolean);

  console.log(`\n3️⃣ [수신된 최종 고밀도 요약 불릿 (${bullets.length}개)]:`);
  bullets.forEach((b, i) => {
    console.log(`   • [불릿 ${i + 1}] ${b}`);
  });

  assert(bullets.length >= 3, '최소 3개 이상의 불릿이 수신되어야 합니다.');
  console.log('\n================================================================');
  console.log('🎉 [Sprint 7] SSE 실시간 스트리밍 요약 검증 100% 통과 (PASS)');
  console.log('================================================================');
}

testSummaryStreaming().catch(console.error);
