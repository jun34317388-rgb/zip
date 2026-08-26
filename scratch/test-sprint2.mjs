async function runSprint2Tests() {
  console.log('=== Sprint 2: Outline Extraction API Tests ===\n');
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

  const sampleLectureText = `
# 데이터베이스 시스템 개요
데이터베이스(Database)는 조직의 여러 사용자가 공유하여 사용할 수 있도록 통합해서 저장한 운영 데이터의 집합이다.
파일 처리 시스템의 한계를 극복하기 위해 등장하였으며 데이터의 중복성과 종속성 문제를 근본적으로 해결한다.

# 관계형 데이터 모델과 SQL
관계형 데이터 모델은 데이터를 2차원 테이블(릴레이션) 형태로 표현하며 각 행을 튜플, 열을 애트리뷰트라고 부른다.
SQL(Structured Query Language)은 관계형 데이터베이스에서 데이터를 정의, 조작, 제어하기 위한 표준 언어이다.

# 트랜잭션과 동시성 제어
트랜잭션(Transaction)은 데이터베이스의 완전성을 보장하기 위한 하나의 논리적 작업 단위를 의미한다.
ACID 특성인 원자성(Atomicity), 일관성(Consistency), 고립성(Isolation), 지속성(Durability)을 반드시 만족해야 한다.
  `.trim();

  // Test 1: Short text validation (< 50 chars)
  try {
    const res = await fetch('http://localhost:3000/api/ai/outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullText: 'Short text' }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.errorKey === 'NO_TEXT_EXTRACTED', '1. Short text rejected with 400 & NO_TEXT_EXTRACTED');
  } catch (err) {
    assert(false, `1. Short text test error: ${err}`);
  }

  // Test 2: Valid lecture text outline generation
  try {
    const res = await fetch('http://localhost:3000/api/ai/outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullText: sampleLectureText }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, '2. Valid text returns 200 & success');
    assert(Array.isArray(data.outlines) && data.outlines.length >= 3, `3. Outlines extracted count >= 3 (got ${data.outlines?.length})`);
    
    const first = data.outlines?.[0];
    assert(typeof first.title === 'string' && first.title.length > 0, '4. First outline has valid title');
    assert(typeof first.contentSlice === 'string' && first.contentSlice.length > 10, '5. First outline has contentSlice');
  } catch (err) {
    assert(false, `2. Valid outline generation test error: ${err}`);
  }

  console.log(`\nSprint 2 Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSprint2Tests();
