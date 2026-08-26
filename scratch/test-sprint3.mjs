async function runSprint3Tests() {
  console.log('=== Sprint 3: Summary & Quiz API Tests ===\n');
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

  const sampleContentSlice = `
관계형 데이터베이스(RDB)는 데이터를 행과 열로 이루어진 2차원 테이블(Relation) 형태로 저장하고 관리하는 데이터베이스입니다.
각 테이블은 고유한 식별자인 기본키(Primary Key)를 가지며, 다른 테이블과의 관계를 표현하기 위해 외래키(Foreign Key)를 사용합니다.
관계 대수(Relational Algebra)는 릴레이션을 조작하기 위한 연산자들의 모임으로, 셀렉트(Select), 프로젝트(Project), 조인(Join) 등이 핵심 연산에 해당합니다.
무결성 제약조건은 데이터의 정확성과 일관성을 유지하기 위한 규범으로, 개체 무결성(기본키는 NULL이 될 수 없고 중복 불가)과 참조 무결성(외래키는 유효한 기본키를 참조)이 있습니다.
  `.trim();

  // Test 1: Summary API
  try {
    const res = await fetch('http://localhost:3000/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentSlice: sampleContentSlice, title: '관계형 데이터 모델' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, '1. Summary API returns 200 & success');
    assert(Array.isArray(data.bullets) && data.bullets.length >= 3, `2. Summary bullets count >= 3 (got ${data.bullets?.length})`);
    assert(data.bullets[0].length >= 10, '3. First summary bullet has substantive content');
  } catch (err) {
    assert(false, `1. Summary API test error: ${err}`);
  }

  // Test 2: Quiz API
  try {
    const res = await fetch('http://localhost:3000/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentSlice: sampleContentSlice, title: '관계형 데이터 모델' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, '4. Quiz API returns 200 & success');
    assert(Array.isArray(data.quizzes) && data.quizzes.length >= 2, `5. Quiz count >= 2 (got ${data.quizzes?.length})`);
    
    const firstQuiz = data.quizzes?.[0];
    assert(typeof firstQuiz.question === 'string' && firstQuiz.question.length > 5, '6. Quiz question valid');
    assert(Array.isArray(firstQuiz.options) && firstQuiz.options.length === 4, '7. Quiz has 4 options');
    assert(typeof firstQuiz.answer === 'number' && firstQuiz.answer >= 0 && firstQuiz.answer <= 3, '8. Quiz answer index valid (0-3)');
    assert(typeof firstQuiz.explanation === 'string' && firstQuiz.explanation.length > 5, '9. Quiz explanation present');
  } catch (err) {
    assert(false, `2. Quiz API test error: ${err}`);
  }

  console.log(`\nSprint 3 Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSprint3Tests();
