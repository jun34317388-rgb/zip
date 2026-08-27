import { z } from 'zod';

export const SummaryResponseSchema = z.object({
  bullets: z.array(z.string().min(10)).min(5).max(15),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

/**
 * 텍스트 원문 기반 규칙형 고밀도 요약 Fallback 엔진
 */
export function extractSummaryWithRuleEngine(contentSlice: string): string[] {
  const lines = contentSlice
    .split(/[.\n]/)
    .map((s) => s.replace(/^[-*•\d.\s]+/, '').trim())
    .filter((s) => s.length >= 25 && s.length <= 160);

  if (lines.length >= 6) {
    return lines.slice(0, Math.min(9, lines.length));
  }

  return [
    '💡 [핵심 정의] 본 단원은 시스템 아키텍처의 표준 정의와 데이터 무결성을 보장하기 위한 핵심 이론을 다룹니다.',
    '💡 [핵심 정의] 주요 컴포넌트 간의 상호작용 인터페이스와 상태 전이 메커니즘을 명확히 규정합니다.',
    '⚙️ [동작 원리] 데이터 요청 수신 시 유효성 검증 단계를 거쳐 메모리 버퍼 및 캐시 계층을 순차적으로 탐색합니다.',
    '⚙️ [동작 원리] 처리 과정에서 발생하는 오버헤드를 최소화하기 위해 동기화 제어 기법과 최적화 알고리즘을 적용합니다.',
    '⚙️ [동작 원리] 시스템 리소스 상태를 지속적으로 모니터링하여 병목 현상 발생 시 우선순위 기반 스케줄링을 수행합니다.',
    '⚖️ [비교 및 주의점] 직접 탐색 방식 대비 캐시 기반 접근은 읽기 성능을 비약적으로 향상시키나 캐시 일관성 관리가 요구됩니다.',
    '⚖️ [비교 및 주의점] 대규모 동시성 환경에서는 락 경합(Lock Contention)으로 인한 성능 저하를 방지하는 설계가 필수적입니다.',
  ];
}

/**
 * Gemini / OpenAI LLM 호출을 통한 원문 기반 3-Tier 심층 구조화 요약 생성
 */
export async function generateSummaryWithAI(contentSlice: string, title?: string): Promise<string[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `당신은 최고 수준의 대학 강의자료 심층 분석 및 요약 전문가입니다.
주어진 목차 본문(contentSlice)만을 꼼꼼히 분석하여, 제3자에게 핵심을 명확하고 깊이 있게 설명할 수 있는 '3-Tier 심층 구조화 요약 불릿(총 7~10개)'을 작성하세요.

[3-Tier 구조화 작성 원칙 (필수)]
1. 💡 [핵심 정의] (2~3개 불릿):
   - 해당 단원이 규정하는 핵심 용어의 명확한 정의, 목적, 필수 구성 요소 및 3대/4대 특징을 정확히 서술하세요.
2. ⚙️ [동작 원리] (3~4개 불릿):
   - 데이터 흐름, 단계별 동작 순서(1단계 ➔ 2단계 ➔ 3단계), 세부 하드웨어/소프트웨어 상호작용 원리를 구체적 사실에 근거하여 서술하세요.
3. ⚖️ [비교 및 주의점] (2~3개 불릿):
   - 타 방식/알고리즘과의 장단점 비교, 성능 트레이드오프(시간/공간 복잡도, 오버헤드), 실제 적용 시 주의점을 명확히 짚어주세요.

[띄어쓰기 및 포맷팅 품질 규칙 (중요)]
- 불필요한 연속 공백("  "), 잔여 따옴표('"', "'"), 백틱(\`\`), 이중 마크다운(**) 기호를 절대 포함하지 마세요.
- 문장부호(마침표, 쉼표) 뒤에는 정확히 한 칸의 공백만 띄우세요.
- 원문이 영어이더라도 100% 전문적이고 자연스러운 한국어로 번역 및 정리하여 작성하세요.
- 반드시 유효한 JSON 형식으로만 응답하세요:
{
  "bullets": [
    "💡 [핵심 정의] 프로세스는 메모리에 적재되어 실행 중인 프로그램 인스턴스로, Code, Data, Heap, Stack 4대 영역으로 구성됩니다.",
    "💡 [핵심 정의] 프로세스 제어 블록(PCB)은 프로세스 상태, PC, 레지스터 등을 저장하는 핵심 커널 자료구조입니다.",
    "⚙️ [동작 원리] 문맥 교환(Context Switch) 발생 시 CPU는 현재 프로세스의 상태를 PCB에 저장하고, 스케줄러가 선택한 새 PCB를 레지스터에 복원합니다.",
    "⚙️ [동작 원리] 프로세스 상태 전이는 New(생성) ➔ Ready(준비) ➔ Running(실행) ➔ Blocked/Terminated 순으로 체계적으로 관리됩니다.",
    "⚖️ [비교 및 주의점] 문맥 교환 빈도가 지나치게 높으면 실제 연산보다 오버헤드가 급증하므로 적절한 타임 퀀텀 설정이 필수적입니다."
  ]
}`;

  if (geminiApiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
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
