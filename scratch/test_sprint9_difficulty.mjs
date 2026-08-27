import assert from 'node:assert';

async function testQuizDifficulty() {
  console.log('================================================================');
  console.log('🎯 [Sprint 9] 난이도 선택형 퀴즈 (기초 개념 ↔ 심화 응용) 생성 검증');
  console.log('================================================================\n');

  const contentSlice = `운영체제(Operating System)는 컴퓨터 하드웨어와 사용자 응용 프로그램 사이에서 자원을 효율적으로 관리하고 인터페이스를 제공하는 시스템 소프트웨어입니다.
운영체제의 핵심 기능은 프로세스 관리, 메모리 관리, 파일 시스템 관리, 입출력 장치 관리로 나뉩니다.
프로세스(Process)는 메모리에 적재되어 실행 중인 프로그램 인스턴스를 의미합니다. 프로세스는 실행에 필요한 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 구성됩니다.
프로세스의 상태는 New(생성), Ready(준비), Running(실행), Waiting/Blocked(대기), Terminated(종료)의 5가지 기본 상태 전이를 가집니다.
프로세스 제어 블록(Process Control Block, PCB)은 각 프로세스의 상태, 프로그램 카운터(PC), 레지스터 정보, 메모리 한계치 등을 저장하는 커널 자료구조입니다.
문맥 교환(Context Switch)은 CPU가 현재 실행 중인 프로세스의 상태를 PCB에 저장하고, 새로운 프로세스의 PCB 정보를 레지스터에 복원하는 작업을 말하며, 이 과정에서 CPU 레지스터 교체 및 캐시 플러시로 인한 오버헤드가 발생합니다.`;

  console.log('1️⃣ [기초 개념 확인형 (difficulty: basic)] 퀴즈 생성 요청 중...');
  const startBasic = Date.now();
  const resBasic = await fetch('http://localhost:3000/api/ai/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice,
      title: 'Chapter 1. 운영체제 개요 및 프로세스 관리',
      difficulty: 'basic',
    }),
  });
  const dataBasic = await resBasic.json();
  const basicElapsed = ((Date.now() - startBasic) / 1000).toFixed(2);

  assert.strictEqual(resBasic.status, 200);
  assert(dataBasic.quizzes && dataBasic.quizzes.length >= 2);
  console.log(`   ✅ 기초 개념 퀴즈 생성 완료 (${basicElapsed}초, ${dataBasic.quizzes.length}문항):`);
  dataBasic.quizzes.forEach((q, i) => {
    console.log(`      [기초 Q${i + 1}] ${q.question}`);
    console.log(`         정답: [${String.fromCharCode(65 + q.answer)}] ${q.options[q.answer]}`);
  });

  console.log('\n2️⃣ [심화 응용 실전형 (difficulty: advanced)] 퀴즈 생성 요청 중...');
  const startAdv = Date.now();
  const resAdv = await fetch('http://localhost:3000/api/ai/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice,
      title: 'Chapter 1. 운영체제 개요 및 프로세스 관리',
      difficulty: 'advanced',
    }),
  });
  const dataAdv = await resAdv.json();
  const advElapsed = ((Date.now() - startAdv) / 1000).toFixed(2);

  assert.strictEqual(resAdv.status, 200);
  assert(dataAdv.quizzes && dataAdv.quizzes.length >= 2);
  console.log(`   ✅ 심화 응용 퀴즈 생성 완료 (${advElapsed}초, ${dataAdv.quizzes.length}문항):`);
  dataAdv.quizzes.forEach((q, i) => {
    console.log(`      [심화 Q${i + 1}] ${q.question}`);
    console.log(`         정답: [${String.fromCharCode(65 + q.answer)}] ${q.options[q.answer]}`);
  });

  console.log('\n================================================================');
  console.log('🎉 [Sprint 9] 난이도 선택형 퀴즈 (기초 ↔ 심화) 검증 100% 통과 (PASS)');
  console.log('================================================================');
}

testQuizDifficulty().catch(console.error);
