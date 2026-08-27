import assert from 'node:assert';

async function testQuizHint() {
  console.log('================================================================');
  console.log('🧠 [Sprint 8] AI 맞춤형 오답 분석 & 복습 가이드 동적 생성 검증');
  console.log('================================================================\n');

  const contentSlice = `프로세스(Process)는 메모리에 적재되어 실행 중인 프로그램 인스턴스를 의미합니다. 프로세스는 실행에 필요한 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 구성됩니다.
프로세스 제어 블록(Process Control Block, PCB)은 각 프로세스의 상태, 프로그램 카운터(PC), 레지스터 정보, 메모리 한계치 등을 저장하는 커널 자료구조입니다.
문맥 교환(Context Switch)은 CPU가 현재 실행 중인 프로세스의 상태를 PCB에 저장하고, 새로운 프로세스의 PCB 정보를 레지스터에 복원하는 작업을 말하며 오버헤드가 발생합니다.`;

  const testQuestion = {
    question: '다음 중 프로세스를 구성하는 4가지 메모리 영역에 포함되지 않는 것은?',
    options: ['코드(Code) 영역', '데이터(Data) 영역', '커널(Kernel) 영역', '스택(Stack) 영역'],
    selectedOption: 0, // 학습자가 오답으로 '코드(Code) 영역'을 잘못 선택한 상황 (실제 정답은 2번 '커널 영역')
    answer: 2,
    contentSlice,
    title: 'Chapter 1. 운영체제 개요 및 프로세스 관리',
  };

  console.log('1️⃣ [오답 시나리오 설정]:');
  console.log(`   - 질문: ${testQuestion.question}`);
  console.log(`   - 학습자 선택 (오답): ${testQuestion.options[testQuestion.selectedOption]}`);
  console.log(`   - 실제 정답: ${testQuestion.options[testQuestion.answer]}`);

  console.log('\n2️⃣ [POST /api/ai/quiz-hint] Gemini 3.6 Flash 오답 분석 요청 중...');
  const startTime = Date.now();

  const res = await fetch('http://localhost:3000/api/ai/quiz-hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testQuestion),
  });

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  assert.strictEqual(res.status, 200, '응답 상태 코드는 200이어야 합니다.');
  assert(data.success, '응답 success 플래그는 true이어야 합니다.');
  assert(data.hint, 'hint 객체가 존재해야 합니다.');

  console.log(`\n3️⃣ [수신된 맞춤 오답 분석 결과 (${elapsed}초 소요)]:`);
  console.log(`   🔍 [오답 원인 분석]: ${data.hint.whyWrong}`);
  console.log(`   📖 [복습 포인트]: ${data.hint.reviewGuide}`);
  console.log(`   💡 [핵심 요약]: ${data.hint.keyPoint}`);

  assert(data.hint.whyWrong.length > 5, '오답 분석 문장이 충실해야 합니다.');
  assert(data.hint.reviewGuide.length > 5, '복습 가이드 문장이 충실해야 합니다.');

  console.log('\n================================================================');
  console.log('🎉 [Sprint 8] AI 맞춤형 오답 힌트 및 복습 가이드 검증 100% 통과 (PASS)');
  console.log('================================================================');
}

testQuizHint().catch(console.error);
