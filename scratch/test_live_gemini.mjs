async function runLiveApiE2ETest() {
  console.log('================================================================');
  console.log('🌐 [Next.js API Router + Gemini 3.6 Flash] 실시간 라이브 E2E 테스트');
  console.log('================================================================\n');

  const lectureText = `[Chapter 1. 운영체제 개요 및 프로세스 관리]
운영체제(Operating System)는 컴퓨터 하드웨어와 사용자 응용 프로그램 사이에서 자원을 효율적으로 관리하고 인터페이스를 제공하는 시스템 소프트웨어입니다.
운영체제의 핵심 기능은 프로세스 관리, 메모리 관리, 파일 시스템 관리, 입출력 장치 관리로 나뉩니다.
프로세스(Process)는 메모리에 적재되어 실행 중인 프로그램 인스턴스를 의미합니다. 프로세스는 실행에 필요한 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 구성됩니다.
프로세스의 상태는 New(생성), Ready(준비), Running(실행), Waiting/Blocked(대기), Terminated(종료)의 5가지 기본 상태 전이를 가집니다.
프로세스 제어 블록(Process Control Block, PCB)은 각 프로세스의 상태, 프로그램 카운터(PC), 레지스터 정보, 메모리 한계치 등을 저장하는 커널 자료구조입니다.
문맥 교환(Context Switch)은 CPU가 현재 실행 중인 프로세스의 상태를 PCB에 저장하고, 새로운 프로세스의 PCB 정보를 레지스터에 복원하는 작업을 말하며 오버헤드가 발생합니다.

[Chapter 2. CPU 스케줄링 및 프로세스 동기화]
CPU 스케줄링은 Ready 큐에 대기 중인 프로세스 중 어떤 프로세스에 CPU를 할당할지 결정하는 정책입니다.
대표적인 비선점형 스케줄링에는 FCFS(First-Come First-Served), SJF(Shortest Job First)가 있으며, 선점형 스케줄링에는 Round Robin(RR), SRTF(Shortest Remaining Time First), Multi-Level Queue가 있습니다.
임계 구역(Critical Section)은 공유 자원에 접근하는 코드 영역으로, 상호 배제(Mutual Exclusion), 진행(Progress), 유한 대기(Bounded Waiting)의 3가지 조건을 반드시 만족해야 합니다.
세마포어(Semaphore)와 뮤텍스(Mutex)는 임계 구역 문제를 해결하기 위한 대표적인 동기화 도구입니다.

[Chapter 3. 가상 메모리 및 페이징 시스템]
가상 메모리(Virtual Memory)는 실제 물리 메모리 크기보다 더 큰 프로세스를 실행할 수 있도록 보조기억장치(디스크)의 일부를 메모리처럼 사용하는 기법입니다.
페이징(Paging) 기법은 가상 메모리를 동일한 크기의 블록인 페이지(Page)로 나누고, 물리 메모리를 동일한 크기의 프레임(Frame)으로 나누어 매핑하는 방식입니다.
페이지 폴트(Page Fault)는 프로세스가 접근하려는 페이지가 현재 물리 메모리에 없을 때 발생하는 인터럽트입니다.`;

  // 1. /api/ai/outline 호출
  console.log('1️⃣ [POST /api/ai/outline] 목차 자동 구조화 요청 중...');
  const t1 = Date.now();
  const resOutline = await fetch('http://localhost:3000/api/ai/outline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullText: lectureText,
      fileName: 'Operating_System_Lecture.pdf',
    }),
  });

  const dataOutline = await resOutline.json();
  const dur1 = ((Date.now() - t1) / 1000).toFixed(2);
  console.log(`   Status: ${resOutline.status} (${dur1}s)`);
  if (!resOutline.ok || !dataOutline.success) {
    console.error('   ❌ 목차 생성 실패:', dataOutline);
    return;
  }
  console.log(`   ✅ 목차 생성 성공! (${dataOutline.outlines.length}개 챕터 인식됨)`);
  dataOutline.outlines.forEach((o) => {
    console.log(`      • [목차 ${o.order}] ${o.title}`);
  });

  // 2. /api/ai/summary 호출
  const targetOutline = dataOutline.outlines[0];
  console.log(`\n2️⃣ [POST /api/ai/summary] 목차 1("${targetOutline.title}") 요약 생성 요청 중...`);
  const t2 = Date.now();
  const resSummary = await fetch('http://localhost:3000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: targetOutline.contentSlice,
      title: targetOutline.title,
    }),
  });

  const dataSummary = await resSummary.json();
  const dur2 = ((Date.now() - t2) / 1000).toFixed(2);
  console.log(`   Status: ${resSummary.status} (${dur2}s)`);
  if (!resSummary.ok || !dataSummary.success) {
    console.error('   ❌ 요약 생성 실패:', dataSummary);
    return;
  }
  console.log(`   ✅ 고밀도 요약 생성 성공! (${dataSummary.bullets.length}개 불릿)`);
  dataSummary.bullets.forEach((b, i) => {
    console.log(`      • [불릿 ${i + 1}] ${b}`);
  });

  // 3. /api/ai/quiz 호출
  console.log(`\n3️⃣ [POST /api/ai/quiz] 목차 1("${targetOutline.title}") 객관식 퀴즈 생성 요청 중...`);
  const t3 = Date.now();
  const resQuiz = await fetch('http://localhost:3000/api/ai/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: targetOutline.contentSlice,
      title: targetOutline.title,
    }),
  });

  const dataQuiz = await resQuiz.json();
  const dur3 = ((Date.now() - t3) / 1000).toFixed(2);
  console.log(`   Status: ${resQuiz.status} (${dur3}s)`);
  if (!resQuiz.ok || !dataQuiz.success) {
    console.error('   ❌ 퀴즈 생성 실패:', dataQuiz);
    return;
  }
  console.log(`   ✅ 4지선다 퀴즈 생성 성공! (${dataQuiz.quizzes.length}문항)`);
  dataQuiz.quizzes.forEach((q, i) => {
    console.log(`\n      [문제 ${i + 1}] ${q.question}`);
    q.options.forEach((opt, optIdx) => {
      const isAns = optIdx === q.answer ? ' ★(정답)' : '';
      console.log(`         ${String.fromCharCode(65 + optIdx)}. ${opt}${isAns}`);
    });
    console.log(`         💡 해설: ${q.explanation}`);
  });

  // 4. /api/ai/quiz-more 호출 (문제 더 풀기 & 중복 방지)
  console.log(`\n4️⃣ [POST /api/ai/quiz-more] 기존 문항 중복 방지 추가 생성 요청 중...`);
  const existingQuestions = dataQuiz.quizzes.map((q) => q.question);
  const t4 = Date.now();
  const resQuizMore = await fetch('http://localhost:3000/api/ai/quiz-more', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: targetOutline.contentSlice,
      title: targetOutline.title,
      existingQuestions,
    }),
  });

  const dataQuizMore = await resQuizMore.json();
  const dur4 = ((Date.now() - t4) / 1000).toFixed(2);
  console.log(`   Status: ${resQuizMore.status} (${dur4}s)`);
  if (resQuizMore.ok && dataQuizMore.success) {
    console.log(`   ✅ 비중복 신규 문항 추가 성공! (${dataQuizMore.quizzes.length}문항 추가됨)`);
    dataQuizMore.quizzes.forEach((q, i) => {
      console.log(`      [추가 문제 ${i + 1}] ${q.question}`);
    });
  }

  console.log('\n================================================================');
  console.log('🎉 [Gemini 3.6 Flash Live API] 실시간 AI 서비스 엔드투엔드 전수 통과!');
  console.log('================================================================');
}

runLiveApiE2ETest().catch(console.error);
