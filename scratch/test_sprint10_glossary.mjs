import assert from 'node:assert';

async function testGlossary() {
  console.log('================================================================');
  console.log('📖 [Sprint 10] 핵심 전공 용어집(Glossary) 자동 추출 & 툴팁 검증');
  console.log('================================================================\n');

  const contentSlice = `운영체제(Operating System)는 컴퓨터 하드웨어와 사용자 응용 프로그램 사이에서 자원을 효율적으로 관리하고 인터페이스를 제공하는 시스템 소프트웨어입니다.
운영체제의 핵심 기능은 프로세스 관리, 메모리 관리, 파일 시스템 관리, 입출력 장치 관리로 나뉩니다.
프로세스(Process)는 메모리에 적재되어 실행 중인 프로그램 인스턴스를 의미합니다. 프로세스는 실행에 필요한 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 구성됩니다.
프로세스의 상태는 New(생성), Ready(준비), Running(실행), Waiting/Blocked(대기), Terminated(종료)의 5가지 기본 상태 전이를 가집니다.
프로세스 제어 블록(Process Control Block, PCB)은 각 프로세스의 상태, 프로그램 카운터(PC), 레지스터 정보, 메모리 한계치 등을 저장하는 커널 자료구조입니다.
문맥 교환(Context Switch)은 CPU가 현재 실행 중인 프로세스의 상태를 PCB에 저장하고, 새로운 프로세스의 PCB 정보를 레지스터에 복원하는 작업을 말하며 오버헤드가 발생합니다.`;

  console.log('1️⃣ [POST /api/ai/glossary] 핵심 전공 용어 추출 요청 중...');
  const startTime = Date.now();

  const res = await fetch('http://localhost:3000/api/ai/glossary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice,
      title: 'Chapter 1. 운영체제 개요 및 프로세스 관리',
    }),
  });

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('   📡 응답 수신:', JSON.stringify(data));

  assert.strictEqual(res.status, 200, '응답 상태 코드는 200이어야 합니다.');
  assert(data.success, '응답 success 플래그는 true이어야 합니다.');
  assert(Array.isArray(data.glossary) && data.glossary.length >= 3, '최소 3개 이상의 핵심 용어가 추출되어야 합니다.');

  console.log(`\n2️⃣ [수신된 핵심 전공 용어 사전 목록 (${elapsed}초 소요, 총 ${data.glossary.length}개 추출)]:`);
  data.glossary.forEach((item, i) => {
    console.log(`   [용어 ${i + 1}] 📌 ${item.term} [분류: ${item.category || '기본'}]`);
    console.log(`      ↳ 정의: ${item.definition}`);
  });

  console.log('\n================================================================');
  console.log('🎉 [Sprint 10] 핵심 용어집(Glossary) 자동 추출 검증 100% 통과 (PASS)');
  console.log('================================================================');
}

testGlossary().catch(console.error);
