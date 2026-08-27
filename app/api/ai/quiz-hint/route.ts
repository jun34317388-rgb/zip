import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, options, selectedOption, answer, contentSlice, title } = await req.json();

    if (!question || options === undefined || selectedOption === undefined || answer === undefined) {
      return NextResponse.json(
        { success: false, errorKey: 'AI_INVALID_FORMAT' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const chosenText = options[selectedOption] || '';
    const correctText = options[answer] || '';

    // Fallback 힌트
    const fallbackHint = {
      whyWrong: `선택하신 '${chosenText}'(은)는 정답인 '${correctText}'와 구분되는 개념입니다.`,
      reviewGuide: `본 단원('${title || '강의 내용'}')의 원문 정의와 핵심 조건을 다시 확인해보세요.`,
      keyPoint: `정답: ${correctText}`,
    };

    if (!geminiApiKey) {
      return NextResponse.json({ success: true, hint: fallbackHint });
    }

    const prompt = `당신은 강의자료 퀴즈 맞춤형 학습 튜터입니다.
학습자가 객관식 퀴즈에서 오답을 선택했습니다.
원문 강의 내용만을 기반으로, 학습자가 왜 헷갈렸는지 짚어주고 올바른 개념을 상기할 수 있도록 맞춤 복습 힌트를 2~3문장의 명확한 한국어로 간결하게 작성하세요.

[다국어 및 번역 규칙 (중요)]
- 원문 내용이나 문제가 영어로 되어 있더라도, 모든 피드백(whyWrong, reviewGuide, keyPoint)은 100% 자연스럽고 친절한 '한국어(Korean)'로 작성하세요.

[퀴즈 정보]
- 문제: ${question}
- 학습자가 고른 오답: ${chosenText}
- 실제 정답: ${correctText}
- 목차/주제: ${title || '강의 내용'}

[원문 내용]
${(contentSlice || '').slice(0, 10000)}

[응답 형식 - 반드시 아래 JSON으로만 응답]
{
  "whyWrong": "학습자가 선택한 보기의 오류 이유 (한국어 1문장)",
  "reviewGuide": "원문에서 다시 주목해야 할 핵심 문장이나 정의 (한국어 1문장)",
  "keyPoint": "핵심 키포인트 요약 (한국어 1문장)"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ success: true, hint: fallbackHint });
    }

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return NextResponse.json({ success: true, hint: fallbackHint });
    }

    const parsed = JSON.parse(rawJson);
    return NextResponse.json({
      success: true,
      hint: {
        whyWrong: parsed.whyWrong || fallbackHint.whyWrong,
        reviewGuide: parsed.reviewGuide || fallbackHint.reviewGuide,
        keyPoint: parsed.keyPoint || fallbackHint.keyPoint,
      },
    });
  } catch (error: any) {
    console.error('Quiz hint error:', error);
    return NextResponse.json({
      success: true,
      hint: {
        whyWrong: '오답에 대한 추가 복습이 필요합니다.',
        reviewGuide: '원문의 기본 정의를 확인하세요.',
        keyPoint: '핵심 개념 재점검',
      },
    });
  }
}
