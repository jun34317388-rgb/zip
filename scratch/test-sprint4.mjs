import { calculateTextSimilarity, filterDuplicateQuizzes } from '../lib/ai/dedup.ts';

async function runSprint4Tests() {
  console.log('=== Sprint 4: Quiz Expansion & Deduplication Tests ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Test Text Similarity
  const sim1 = calculateTextSimilarity('DBMS의 정의는 무엇인가요?', 'DBMS의 정의는 무엇인가요?');
  assert(sim1 === 1.0, '1. Identical text has 1.0 similarity');

  const sim2 = calculateTextSimilarity('DBMS의 핵심 정의는 무엇인가요?', 'DBMS의 정의는 무엇인가요?');
  assert(sim2 >= 0.70, `2. Minor variation has high similarity (${sim2.toFixed(2)})`);

  const sim3 = calculateTextSimilarity('트랜잭션 ACID 특성이란?', '관계형 모델의 기본키 정의');
  assert(sim3 < 0.30, `3. Completely different questions have low similarity (${sim3.toFixed(2)})`);

  // 2. Test filterDuplicateQuizzes
  const existingQuestions = [
    'DBMS가 사용자에게 제공하는 가장 중요한 추상화는 무엇인가요?',
    '데이터베이스의 3단계 스키마 구조에 포함되지 않는 것은 무엇인가요?',
  ];

  const incomingQuizzes = [
    {
      id: 'test-dup-1',
      question: 'DBMS가 사용자에게 제공하는 가장 중요한 추상화는 무엇인가요?',
      options: ['A', 'B', 'C', 'D'],
      answer: 0,
      explanation: '해설',
    },
    {
      id: 'test-new-1',
      question: '관계형 모델에서 외래키(Foreign Key)의 주된 역할은 무엇인가요?',
      options: ['A', 'B', 'C', 'D'],
      answer: 1,
      explanation: '해설 2',
    },
  ];

  const dedupResult = filterDuplicateQuizzes(incomingQuizzes, [...existingQuestions]);
  assert(dedupResult.duplicateCount === 1, '4. Detected 1 duplicate question');
  assert(dedupResult.validQuizzes.length === 1, '5. Filtered out duplicate, leaving 1 valid quiz');
  assert(dedupResult.validQuizzes[0].id === 'test-new-1', '6. Retained unique quiz correctly');

  // 3. Test /api/ai/quiz-more endpoint
  try {
    const res = await fetch('http://localhost:3000/api/ai/quiz-more', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentSlice: '트랜잭션은 하나의 논리적 작업 단위입니다. ACID 특성을 가집니다.',
        title: '트랜잭션 관리',
        existingQuestions: ['트랜잭션의 ACID 특성에 해당하지 않는 것은?'],
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, '7. /api/ai/quiz-more returns 200 & success');
    assert(Array.isArray(data.quizzes) && data.quizzes.length >= 2, `8. Returns new quizzes (got ${data.quizzes?.length})`);
  } catch (err) {
    assert(false, `3. /api/ai/quiz-more test error: ${err}`);
  }

  console.log(`\nSprint 4 Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSprint4Tests();
