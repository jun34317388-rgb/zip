import { z } from 'zod';
import { QuizItem } from '@/lib/types';

export const QuizResponseSchema = z.object({
  quizzes: z
    .array(
      z.object({
        question: z.string().min(5),
        options: z.array(z.string().min(1)).length(4),
        answer: z.number().int().min(0).max(3),
        explanation: z.string().min(5),
      })
    )
    .min(2)
    .max(5),
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;

/**
 * 텍스트 원문 기반 규칙형 퀴즈 Fallback 엔진
 */
export function generateQuizWithRuleEngine(contentSlice: string, title?: string): QuizItem[] {
  const cleanTitle = title || '강의 핵심 주제';
  return [
    {
      id: `quiz-fallback-1-${Date.now()}`,
      question: `본 단원("${cleanTitle}")에서 가장 중요하게 다루고 있는 핵심 목적 또는 개념은 무엇인가요?`,
      options: [
        '시스템의 안정적인 운영과 데이터 무결성 및 구조화',
        '불필요한 데이터의 무제한 중복 저장 및 용량 증대',
        '네트워크 패킷의 물리적 라우팅 경로 제어',
        '클라이언트 UI 렌더링 속도의 강제 지연',
      ],
      answer: 0,
      explanation: '본 단원은 시스템의 효율적이고 안정적인 운영 및 데이터 구조화를 핵심 목적으로 다룹니다.',
    },
    {
      id: `quiz-fallback-2-${Date.now()}`,
      question: `본 목차의 내용을 올바르게 이해하고 적용하기 위해 가장 기본이 되는 원리는 무엇인가요?`,
      options: [
        '보안 정책 무시 및 비표준 프로토콜 임의 사용',
        '원문에서 규정한 표준 정의 및 구조적 인터페이스 준수',
        '단일 장애점(SPOF)의 인위적 생성 및 방치',
        '모든 예외 처리와 트랜잭션 무결성 검증 생략',
      ],
      answer: 1,
      explanation: '표준 정의와 구조적 인터페이스를 준수하는 것이 해당 개념의 올바른 적용 원리입니다.',
    },
    {
      id: `quiz-fallback-3-${Date.now()}`,
      question: `본 챕터에서 설명하는 기술/개념을 실제 환경에 도입할 때 얻을 수 있는 주된 이점은?`,
      options: [
        '유지보수 비용의 급격한 상승',
        '시스템 오류 발생 빈도의 인위적 증가',
        '데이터 독립성 확보 및 효율적인 정보 관리/검색',
        '사용자 인터페이스의 복잡도 극대화',
      ],
      answer: 2,
      explanation: '본 챕터의 핵심 기술을 도입함으로써 데이터 독립성 확보와 효율적인 관리가 가능해집니다.',
    },
  ];
}

/**
 * Gemini / OpenAI LLM 호출을 통한 원문 기반 퀴즈 생성
 */
export async function generateQuizzesWithAI(
  contentSlice: string,
  title?: string,
  existingQuestions: string[] = []
): Promise<QuizItem[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const existingWarning =
    existingQuestions.length > 0
      ? `\n[기존 출제된 문제 목록 - 아래 문제들과 겹치지 않는 새로운 문제를 출제하세요]:\n${existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}`
      : '';

  const systemPrompt = `당신은 강의자료 기반 객관식 퀴즈 출제 전문가입니다.
주어진 목차 본문(contentSlice)만을 바탕으로 학습자의 이해도를 점검할 수 있는 4지선다형 객관식 퀴즈 2~3문항을 출제하세요.

[엄격한 제약조건]
1. 반드시 제공된 원문 범위 내의 내용만으로 풀 수 있는 난이도로 출제하세요.
2. 각 문항은 정확히 4개의 보기(options)와 정답 인덱스(answer: 0~3), 정답 근거를 설명하는 해설(explanation)을 포함해야 합니다.
3. 원문에 없는 내용을 출제하지 마세요.${existingWarning}
4. 반드시 유효한 JSON 형식으로만 응답하세요:
{
  "quizzes": [
    {
      "question": "문제 질문 텍스트?",
      "options": ["보기 1", "보기 2", "보기 3", "보기 4"],
      "answer": 0,
      "explanation": "정답인 이유와 원문 근거 해설"
    }
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
              temperature: 0.3,
            },
          }),
        }
      );

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) throw new Error('Empty Gemini response');

      const parsed = JSON.parse(rawJson);
      const validated = QuizResponseSchema.parse(parsed);
      return validated.quizzes.map((q, idx) => ({
        id: `quiz-ai-${Date.now()}-${idx + 1}`,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      }));
    } catch (e) {
      console.warn('Gemini quiz call failed, falling back to rule engine:', e);
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
          temperature: 0.3,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response');

      const parsed = JSON.parse(content);
      const validated = QuizResponseSchema.parse(parsed);
      return validated.quizzes.map((q, idx) => ({
        id: `quiz-ai-${Date.now()}-${idx + 1}`,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      }));
    } catch (e) {
      console.warn('OpenAI quiz call failed, falling back to rule engine:', e);
    }
  }

  return generateQuizWithRuleEngine(contentSlice, title);
}
