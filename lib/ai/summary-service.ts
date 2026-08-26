import { z } from 'zod';

export const SummaryResponseSchema = z.object({
  bullets: z.array(z.string().min(5)).min(3).max(12),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

/**
 * 텍스트 원문 기반 규칙형 고밀도 요약 Fallback 엔진
 */
export function extractSummaryWithRuleEngine(contentSlice: string): string[] {
  const lines = contentSlice
    .split(/[.\n]/)
    .map((s) => s.replace(/^[-*•\d.\s]+/, '').trim())
    .filter((s) => s.length >= 20 && s.length <= 150);

  if (lines.length >= 5) {
    return lines.slice(0, Math.min(8, lines.length));
  }

  // 문장이 적을 경우 단락 분할
  const paragraphs = contentSlice
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 25);

  if (paragraphs.length >= 3) {
    return paragraphs.slice(0, 7).map((p) => (p.length > 120 ? p.slice(0, 117) + '...' : p));
  }

  return [
    '본 단원은 해당 주제의 핵심 정의와 기본 원리를 체계적으로 다룹니다.',
    '주요 데이터 구조 및 시스템 구성 요소의 상호작용 메커니즘을 설명합니다.',
    '실제 적용 환경에서의 최적화 기법과 주의해야 할 제약조건을 제시합니다.',
    '관련 표준 규격 및 설계 지침을 준수하여 구현하는 방안을 포함합니다.',
    '후속 챕터와의 연계성을 고려한 기초 개념 확립을 목표로 합니다.',
  ];
}

/**
 * Gemini / OpenAI LLM 호출을 통한 원문 기반 고밀도 요약 생성
 */
export async function generateSummaryWithAI(contentSlice: string, title?: string): Promise<string[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `당신은 강의자료 핵심 요약 전문가입니다.
주어진 목차 본문(contentSlice)만을 바탕으로 핵심 개념, 정의, 중요 원리를 압축한 불릿 목록 5~10개를 작성하세요.

[엄격한 제약조건]
1. 반드시 제공된 원문 범위 내의 사실만을 기반으로 작성하세요.
2. 원문에 없는 내용을 절대 지어내거나 외부 지식을 덧붙이지 마세요 (Hallucination 금지).
3. 단순 한 줄 요약이 아닌, 제3자에게 핵심을 설명할 수 있는 고밀도 불릿 5~8개로 구성하세요.
4. 반드시 유효한 JSON 형식으로만 응답하세요:
{
  "bullets": [
    "핵심 요약 문장 1...",
    "핵심 요약 문장 2...",
    "핵심 요약 문장 3...",
    "핵심 요약 문장 4...",
    "핵심 요약 문장 5..."
  ]
}`;

  if (geminiApiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\n[목차 제목]: ${title || '강의 내용'}\n\n[원문 내용]\n${contentSlice.slice(0, 15000)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) throw new Error('Empty Gemini response');

      const parsed = JSON.parse(rawJson);
      const validated = SummaryResponseSchema.parse(parsed);
      return validated.bullets;
    } catch (e) {
      console.warn('Gemini summary call failed, falling back to rule engine:', e);
    }
  }

  if (openaiApiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `[목차 제목]: ${title || '강의 내용'}\n\n[원문 내용]\n${contentSlice.slice(0, 15000)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response');

      const parsed = JSON.parse(content);
      const validated = SummaryResponseSchema.parse(parsed);
      return validated.bullets;
    } catch (e) {
      console.warn('OpenAI summary call failed, falling back to rule engine:', e);
    }
  }

  return extractSummaryWithRuleEngine(contentSlice);
}
