import { z } from 'zod';
import { QuizDifficulty, QuizItem } from '@/lib/types';

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
export function generateQuizWithRuleEngine(
  contentSlice: string,
  title?: string,
  difficulty: QuizDifficulty = 'basic'
): QuizItem[] {
  const cleanTitle = title || '강의 핵심 주제';
  if (difficulty === 'advanced') {
    return [
      {
        id: `quiz-fallback-adv-1-${Date.now()}`,
        question: `본 단원("${cleanTitle}")의 설계 원리를 대규모 분산 환경에 적용할 때 발생할 수 있는 주요 트레이드오프와 해결 방안은?`,
        options: [
          '일관성 유지 비용 증가에 대응하기 위한 완화된 일관성 모델 및 캐싱 전략 도입',
          '데이터의 완전 무작위 분산 저장 및 네트워크 프로토콜 생략',
          '단일 노드 강제 집중 처리로 인한 병목 현상 방치',
          '모든 인덱스와 트랜잭션 무결성 검증의 무조건적 비활성화',
        ],
        answer: 0,
        explanation: '심화 환경에서는 성능과 일관성 사이의 트레이드오프를 고려하여 캐싱 및 최적화된 동기화 기법을 적용합니다.',
        difficulty: 'advanced',
      },
      {
        id: `quiz-fallback-adv-2-${Date.now()}`,
        question: `본 목차에서 다루는 아키텍처/알고리즘의 성능 병목을 해결하기 위한 심화 최적화 접근법은?`,
        options: [
          '하드웨어 자원의 무제한 증설만 의존',
          'I/O 작업 최소화를 위한 메모리 버퍼링 및 인덱스 구조 최적화',
          '예외 처리 루틴을 모두 제거하여 코드 크기 축소',
          '데이터 검증 단계를 생략한 비동기 무제한 적재',
        ],
        answer: 1,
        explanation: '심화 최적화는 I/O 병목을 최소화하고 자료구조의 접근 복잡도를 낮추는 데 중점을 둡니다.',
        difficulty: 'advanced',
      },
    ];
  }

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
      difficulty: 'basic',
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
      difficulty: 'basic',
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
      difficulty: 'basic',
    },
  ];
}

/**
 * Gemini / OpenAI LLM 호출을 통한 원문 기반 퀴즈 생성
 */
export async function generateQuizzesWithAI(
  contentSlice: string,
  title?: string,
  existingQuestions: string[] = [],
  difficulty: QuizDifficulty = 'basic'
): Promise<QuizItem[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const difficultyInstruction =
    difficulty === 'advanced'
      ? `[난이도: 🔥 심화 응용형]
- 단순 단답형 암기 문제를 지양하고, 원문의 원리를 실제 시나리오나 문제 상황에 적용하는 문제, 두 개념 간의 차이점/트레이드오프 비교 분석, 또는 복합 조건 추론 문제를 출제하세요.
- 오답 보기 역시 그럴듯한 오개념이나 유사 용어를 활용하여 실전 시험 수준의 변별력을 갖추세요.`
      : `[난이도: 🌱 기초 개념 확인형]
- 원문에 직접 명시된 핵심 용어의 정의, 기본 구성 요소, 핵심 4대/5대 특징 등 학습자가 반드시 알아야 할 기본기를 확인하는 직관적인 문제를 출제하세요.`;

  const existingWarning =
    existingQuestions.length > 0
      ? `\n[기존 출제된 문제 목록 - 아래 문제들과 겹치지 않는 새로운 문제를 출제하세요]:\n${existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}`
      : '';

  const systemPrompt = `당신은 강의자료 기반 객관식 퀴즈 출제 전문가입니다.
주어진 목차 본문(contentSlice)만을 바탕으로 학습자의 이해도를 점검할 수 있는 4지선다형 객관식 퀴즈 2~3문항을 출제하세요.

[다국어 및 번역 규칙 (중요)]
- 원문 텍스트가 영어(English) 또는 다국어로 작성된 경우에도, 모든 문제 질문(question), 4개 선택지(options), 정답 해설(explanation)은 반드시 자연스럽고 전문적인 '한국어(Korean)'로 작성하세요.
- 핵심 전공 용어는 '한국어 번역어 (영문 원어)' 형태로 표기하면 학습자가 문제를 더 정확히 이해할 수 있습니다.

${difficultyInstruction}

[엄격한 제약조건]
1. 반드시 제공된 원문 범위 내의 내용만으로 풀 수 있는 난이도로 출제하세요.
2. 각 문항은 정확히 4개의 한국어 보기(options)와 정답 인덱스(answer: 0~3), 정답 근거를 설명하는 한국어 해설(explanation)을 포함해야 합니다.
3. 원문에 없는 내용을 출제하지 마세요.${existingWarning}
4. 반드시 유효한 JSON 형식으로만 응답하세요:
{
  "quizzes": [
    {
      "question": "한국어 문제 질문 텍스트?",
      "options": ["한국어 보기 1", "한국어 보기 2", "한국어 보기 3", "한국어 보기 4"],
      "answer": 0,
      "explanation": "정답인 이유와 원문 근거 한국어 해설"
    }
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
