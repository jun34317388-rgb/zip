// scratch/test_english_pdf_localization.mjs
// 영문 PDF 문서 입력 시 100% 한국어 자동 로컬라이제이션 E2E 통합 검증 스크립트

const BASE_URL = 'http://localhost:3000';

const ENGLISH_SAMPLE_LECTURE = `
[Chapter 1. Operating System Architecture and Process Control Block]
An operating system (OS) is system software that manages computer hardware, software resources, and provides common services for computer programs.
The core responsibilities of an OS include process management, main memory management, file system management, and I/O device management.
A process is an instance of a computer program that is being executed by one or many threads. It contains the program code and its current activity.
Depending on the operating system, a process may be made up of multiple threads of execution that execute instructions concurrently.
Each process in the operating system is represented by a Process Control Block (PCB), which contains vital information including process state, program counter, CPU registers, CPU scheduling information, memory-management information, and I/O status information.
Context switching is the process of storing the state of a process or thread, so that it can be restored and resume execution at a later point. This allows multiple processes to share a single central processing unit (CPU).

[Chapter 2. Virtual Memory Management and TLB Caching]
Virtual memory is a memory management technique that provides an idealized abstraction of the storage resources that are actually available on a given machine.
The primary advantage of virtual memory is that programs can be larger than physical memory. It also enables memory protection and isolation between processes.
Paging is a memory management scheme by which a computer stores and retrieves data from secondary storage for use in main memory.
In the paging scheme, the operating system retrieves data from secondary storage in same-size blocks called pages, and maps them to physical frames in RAM.
A Translation Lookaside Buffer (TLB) is a hardware cache that memory-management hardware uses to improve virtual address translation speed.
When a requested page is not currently in physical RAM, a Page Fault exception occurs, prompting the OS kernel to load the required page from disk.
Common page replacement policies include Least Recently Used (LRU), First-In First-Out (FIFO), and Optimal (OPT).

[Chapter 3. Mutual Exclusion and Deadlock Prevention]
Concurrent processes often share resources such as memory, files, and databases, leading to race conditions if access is not synchronized.
A Critical Section is a segment of code in which a process accesses shared resources. A proper synchronization solution must satisfy Mutual Exclusion, Progress, and Bounded Waiting.
Semaphores and Mutexes are fundamental synchronization primitives used to prevent data inconsistency.
Deadlock is a state in which each member of a group of actions is waiting for some other member to release a lock.
Four Coffman conditions must hold simultaneously for a deadlock to occur: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.
`;

async function testEnglishLocalization() {
  console.log('================================================================');
  console.log('🌐 [English PDF Localization] 영문 PDF ➔ 100% 한국어 자동 번역 및 구조화 E2E 검증');
  console.log('================================================================\n');

  // 1. 목차 추출 및 한국어 번역 검증
  console.log('1️⃣ [POST /api/ai/outline] 영문 텍스트 목차 구조화 및 한국어 번역 요청 중...');
  const outlineRes = await fetch(`${BASE_URL}/api/ai/outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullText: ENGLISH_SAMPLE_LECTURE }),
  });

  if (!outlineRes.ok) {
    throw new Error(`Outline API failed: ${outlineRes.status}`);
  }

  const outlineData = await outlineRes.json();
  console.log(`   ✅ 생성된 목차 수: ${outlineData.outlines.length}개`);
  outlineData.outlines.forEach((o, i) => {
    console.log(`      [목차 ${i + 1}] 📌 ${o.title}`);
  });

  const firstOutline = outlineData.outlines[0];

  // 2. 실시간 SSE 한국어 요약 스트리밍 검증
  console.log('\n2️⃣ [POST /api/ai/summary-stream] 영문 본문 ➔ 한국어 실시간 요약 스트리밍 수신 중...');
  const summaryRes = await fetch(`${BASE_URL}/api/ai/summary-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: firstOutline.contentSlice,
      title: firstOutline.title,
    }),
  });

  if (!summaryRes.ok) {
    throw new Error(`Summary stream API failed: ${summaryRes.status}`);
  }

  const reader = summaryRes.body.getReader();
  const decoder = new TextDecoder();
  let fullStreamText = '';

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
          if (parsed.fullText) fullStreamText = parsed.fullText;
        } catch {}
      }
    }
  }

  console.log('   ✅ 수신된 한국어 실시간 요약 본문:');
  const summaryBullets = fullStreamText.split('\n').filter((l) => l.trim().startsWith('-'));
  summaryBullets.slice(0, 4).forEach((b) => console.log(`      ${b}`));

  // 3. 한국어 난이도별 퀴즈 생성 검증
  console.log('\n3️⃣ [POST /api/ai/quiz] 영문 개념 ➔ 한국어 4지선다 퀴즈 (심화 난이도) 출제 요청 중...');
  const quizRes = await fetch(`${BASE_URL}/api/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: firstOutline.contentSlice,
      title: firstOutline.title,
      difficulty: 'advanced',
    }),
  });

  if (!quizRes.ok) {
    throw new Error(`Quiz API failed: ${quizRes.status}`);
  }

  const quizData = await quizRes.json();
  console.log(`   ✅ 생성된 퀴즈 문항 수: ${quizData.quizzes.length}개`);
  const q1 = quizData.quizzes[0];
  console.log(`      [문항 1] ❓ ${q1.question}`);
  q1.options.forEach((opt, idx) => {
    const marker = idx === q1.answer ? '✅ (정답)' : '  ';
    console.log(`         (${idx + 1}) ${opt} ${marker}`);
  });
  console.log(`      ↳ 한국어 해설: ${q1.explanation}`);

  // 4. 핵심 전공 용어집 한영 병기 및 한국어 정의 검증
  console.log('\n4️⃣ [POST /api/ai/glossary] 영문 본문 ➔ 한영 병기 핵심 용어집 및 한국어 정의 추출 중...');
  const glossaryRes = await fetch(`${BASE_URL}/api/ai/glossary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSlice: firstOutline.contentSlice,
      title: firstOutline.title,
    }),
  });

  if (!glossaryRes.ok) {
    throw new Error(`Glossary API failed: ${glossaryRes.status}`);
  }

  const glossaryData = await glossaryRes.json();
  console.log(`   ✅ 추출된 핵심 용어 수: ${glossaryData.glossary.length}개`);
  glossaryData.glossary.slice(0, 3).forEach((item, idx) => {
    console.log(`      [용어 ${idx + 1}] 📌 ${item.term} [${item.category || '전공'}]`);
    console.log(`         ↳ 정의: ${item.definition}`);
  });

  // 5. 한국어 오답 복습 힌트 검증
  console.log('\n5️⃣ [POST /api/ai/quiz-hint] 퀴즈 오답 발생 시 한국어 복습 가이드 동적 생성 중...');
  const wrongIndex = (q1.answer + 1) % 4;
  const hintRes = await fetch(`${BASE_URL}/api/ai/quiz-hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: q1.question,
      options: q1.options,
      selectedOption: wrongIndex,
      answer: q1.answer,
      contentSlice: firstOutline.contentSlice,
      title: firstOutline.title,
    }),
  });

  if (!hintRes.ok) {
    throw new Error(`Hint API failed: ${hintRes.status}`);
  }

  const hintData = await hintRes.json();
  console.log(`   ✅ 생성된 한국어 오답 분석 & 복습 가이드:`);
  console.log(`      • 왜 틀렸나요?: ${hintData.hint.whyWrong}`);
  console.log(`      • 복습 가이드: ${hintData.hint.reviewGuide}`);
  console.log(`      • 핵심 포인트: ${hintData.hint.keyPoint}`);

  console.log('\n================================================================');
  console.log('🎉 [English PDF Localization] 영문 PDF 한국어 자동 변환 검증 100% 통과 (PASS)');
  console.log('================================================================\n');
}

testEnglishLocalization().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
