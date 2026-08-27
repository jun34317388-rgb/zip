import { NextRequest, NextResponse } from 'next/server';
import { GlossaryItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { contentSlice, title } = await req.json();

    if (!contentSlice || typeof contentSlice !== 'string' || contentSlice.trim().length < 10) {
      return NextResponse.json(
        { success: false, errorKey: 'NO_TEXT_EXTRACTED' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Fallback 용어집
    const fallbackGlossary: GlossaryItem[] = [
      {
        term: title?.replace(/^Chapter\s*\d+[.:\s]*/i, '') || '핵심 개념',
        definition: '본 단원에서 다루는 주요 시스템 구성 요소 및 표준 동작 원리입니다.',
        category: '핵심 주제',
      },
    ];

    if (!geminiApiKey) {
      return NextResponse.json({ success: true, glossary: fallbackGlossary });
    }

    const prompt = `당신은 컴퓨터공학 및 강의자료 핵심 용어 사전(Glossary) 구축 전문가입니다.
주어진 목차 본문(contentSlice)에서 학습자가 반드시 숙지해야 할 핵심 전공 용어/키워드 3~5개를 선정하고, 원문에 기반한 명확하고 간결한 정의(1~2문장)를 작성하세요.

[목차 제목]: ${title || '강의 내용'}

[원문 내용]
${contentSlice.slice(0, 12000)}

[응답 형식 - 반드시 아래 JSON 형식으로만 응답]
{
  "glossary": [
    {
      "term": "용어명 (예: PCB, Context Switch)",
      "definition": "원문에 기반한 핵심 정의 (1~2문장)",
      "category": "분류 (예: 시스템, 메모리, 프로세스, 자료구조 등)"
    }
  ]
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
      return NextResponse.json({ success: true, glossary: fallbackGlossary });
    }

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return NextResponse.json({ success: true, glossary: fallbackGlossary });
    }

    const parsed = JSON.parse(rawJson);
    const glossary: GlossaryItem[] = parsed.glossary || fallbackGlossary;

    return NextResponse.json({
      success: true,
      glossary,
    });
  } catch (error: any) {
    console.error('Glossary API error:', error);
    return NextResponse.json({
      success: true,
      glossary: [
        {
          term: '핵심 용어',
          definition: '원문의 주요 정의를 참고하세요.',
          category: '일반',
        },
      ],
    });
  }
}
