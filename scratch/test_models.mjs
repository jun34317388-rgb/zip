import fs from 'node:fs';

let envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

async function listAndTestModels() {
  console.log('--- 1. ListModels 조회 ---');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('ListModels Error:', data);
    } else {
      console.log('Available Models:');
      const models = data.models || [];
      for (const m of models) {
        if (m.supportedGenerationMethods?.includes('generateContent')) {
          console.log(` - ${m.name} (${m.displayName})`);
        }
      }
    }
  } catch (e) {
    console.error('ListModels failed:', e);
  }

  // 2. gemini-2.5-flash 및 gemini-3.6-flash 테스트
  const testCandidates = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  for (const model of testCandidates) {
    console.log(`\n--- 2. [${model}] generateContent 테스트 ---`);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: '한국어로 "안녕하세요"라고 한 단어만 답해주세요.' }] }],
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ [${model}] 호출 성공! 응답:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
      } else {
        console.log(`❌ [${model}] 호출 실패 (${res.status}):`, data.error?.message);
      }
    } catch (err) {
      console.error(`Error testing ${model}:`, err.message);
    }
  }
}

listAndTestModels();
