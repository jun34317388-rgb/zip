import fs from 'node:fs';

// 환경변수 로드
let envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
process.env.GEMINI_API_KEY = match ? match[1].trim() : '';

import { generateOutlinesWithAI } from '../lib/ai/outline-service.ts';
import { generateSummaryWithAI } from '../lib/ai/summary-service.ts';
import { generateQuizzesWithAI } from '../lib/ai/quiz-service.ts';
import { SAMPLE_LECTURES } from '../lib/sample-data.ts';

async function runGeminiPipelineTest() {
  console.log('================================================================');
  console.log('🤖 [Google Gemini 3.6 Flash] AI 파이프라인 실시간 E2E 생성 검증');
  console.log('================================================================\n');

  const lecture = SAMPLE_LECTURES[0]; // 운영체제 강의
  console.log(`[대상 강의자료]: ${lecture.title}`);
  console.log(`[원문 길이]: ${lecture.fullText.length}자\n`);

  // Step 1: 목차 자동 구조화
  console.log('1️⃣ [목차 구조화 (Outline AI)] 호출 중...');
  const startTimeOutline = Date.now();
  const outlines = await generateOutlinesWithAI(lecture.fullText);
  const elapsedOutline = ((Date.now() - startTimeOutline) / 1000).toFixed(2);
  console.log(`   ✅ 목차 생성 성공! (${elapsedOutline}초 소요, 총 ${outlines.length}개 목차)`);
  outlines.forEach((o, i) => {
    console.log(`      ${i + 1}. ${o.title} (본문: ${o.contentSlice.length}자)`);
  });

  // Step 2: 1번 목차에 대한 요약 생성
  const firstOutline = outlines[0];
  console.log(`\n2️⃣ [요약 생성 (Summary AI)] 목차 1("${firstOutline.title}") 호출 중...`);
  const startTimeSummary = Date.now();
  const summaryBullets = await generateSummaryWithAI(firstOutline.contentSlice, firstOutline.title);
  const elapsedSummary = ((Date.now() - startTimeSummary) / 1000).toFixed(2);
  console.log(`   ✅ 요약 생성 성공! (${elapsedSummary}초 소요, 총 ${summaryBullets.length}개 불릿)`);
  summaryBullets.forEach((bullet, idx) => {
    console.log(`      • [${idx + 1}] ${bullet}`);
  });

  // Step 3: 1번 목차에 대한 퀴즈 생성
  console.log(`\n3️⃣ [퀴즈 생성 (Quiz AI)] 목차 1("${firstOutline.title}") 호출 중...`);
  const startTimeQuiz = Date.now();
  const quizzes = await generateQuizzesWithAI(firstOutline.contentSlice, firstOutline.title);
  const elapsedQuiz = ((Date.now() - startTimeQuiz) / 1000).toFixed(2);
  console.log(`   ✅ 퀴즈 생성 성공! (${elapsedQuiz}초 소요, 총 ${quizzes.length}문항)`);
  quizzes.forEach((q, idx) => {
    console.log(`\n      [Q${idx + 1}] ${q.question}`);
    q.options.forEach((opt, optIdx) => {
      const isAns = optIdx === q.answer ? '★(정답)' : '  ';
      console.log(`         ${String.fromCharCode(65 + optIdx)}. ${isAns} ${opt}`);
    });
    console.log(`         💡 해설: ${q.explanation}`);
  });

  console.log('\n================================================================');
  console.log('🎉 Google Gemini 3.6 Flash 실전 AI 서비스 연동 검증 100% 완료!');
  console.log('================================================================');
}

runGeminiPipelineTest().catch(console.error);
