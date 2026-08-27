import fs from 'node:fs';

// .env 또는 .env.local에서 API 키 읽기
let envContent = '';
if (fs.existsSync('.env.local')) {
  envContent = fs.readFileSync('.env.local', 'utf-8');
} else if (fs.existsSync('.env')) {
  envContent = fs.readFileSync('.env', 'utf-8');
}

const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

console.log('=== Gemini API Key 연동 테스트 ===');
console.log('Key prefix:', apiKey ? apiKey.slice(0, 10) + '...' : 'NONE');

async function testGemini() {
  if (!apiKey) {
    console.error('❌ API 키가 없습니다.');
    return;
  }

  // 1. gemini-1.5-flash 테스트
  console.log('\n[1] gemini-1.5-flash 호출 테스트...');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: '안녕하세요! 한 줄로 응답해주세요.' }] }],
        }),
      }
    );

    console.log('Status code:', res.status);
    const data = await res.json();
    if (!res.ok) {
      console.log('API Error response:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ Gemini 1.5 Flash 응답 성공!');
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  } catch (err) {
    console.error('Network/Execution error:', err.message);
  }

  // 2. gemini-2.0-flash 테스트
  console.log('\n[2] gemini-2.0-flash 호출 테스트...');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello! Please reply in 1 line.' }] }],
        }),
      }
    );

    console.log('Status code:', res.status);
    const data = await res.json();
    if (!res.ok) {
      console.log('API Error response:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ Gemini 2.0 Flash 응답 성공!');
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  } catch (err) {
    console.error('Network/Execution error:', err.message);
  }
}

testGemini();
