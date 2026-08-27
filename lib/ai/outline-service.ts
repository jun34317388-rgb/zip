import { z } from 'zod';
import { OutlineItem } from '@/lib/types';

export const OutlineResponseSchema = z.object({
  outlines: z
    .array(
      z.object({
        title: z.string().min(1, '목차 제목이 비어 있습니다.'),
        topicTags: z.array(z.string()).optional().default([]),
        estimatedMinutes: z.number().optional().default(5),
        pageStart: z.number().optional(),
        pageEnd: z.number().optional(),
        pageRange: z.string().optional(),
        contentSlice: z.string().min(1, '목차 본문이 비어 있습니다.'),
      })
    )
    .min(1, '최소 1개 이상의 목차가 필요합니다.'),
});

export type OutlineResponse = z.infer<typeof OutlineResponseSchema>;

/**
 * 텍스트 패턴 기반 지능형 목차 추출 Fallback 파서
 */
export function extractOutlinesWithRuleEngine(fullText: string, totalPages = 20): OutlineItem[] {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const headingRegex = /^(?:제\s*\d+\s*[장절편]|Chapter\s*\d+|Section\s*\d+|\d+\.\s+|[I|V|X]+\.\s+|[가-힣A-Za-z0-9\s]{2,20}:)/i;

  const sections: { title: string; contents: string[] }[] = [];
  let currentTitle = '';
  let currentContents: string[] = [];

  for (const line of lines) {
    const isHeading = headingRegex.test(line) && line.length < 50;
    if (isHeading) {
      if (currentTitle && currentContents.length > 0) {
        sections.push({
          title: currentTitle,
          contents: currentContents,
        });
      }
      currentTitle = line.replace(/^[#\s*]+/, '').trim();
      currentContents = [];
    } else {
      if (!currentTitle && sections.length === 0) {
        currentTitle = line.length < 40 ? line : '개요 및 도입';
      }
      currentContents.push(line);
    }
  }

  if (currentTitle && currentContents.length > 0) {
    sections.push({ title: currentTitle, contents: currentContents });
  }

  const count = Math.max(sections.length, 1);
  const pagesPerSec = Math.max(1, Math.round(totalPages / count));

  if (sections.length < 2) {
    const paragraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    const chunkCount = Math.min(Math.max(3, Math.ceil(paragraphs.length / 3)), 8);
    const chunkSize = Math.ceil(paragraphs.length / chunkCount);
    const pChunk = Math.max(1, Math.round(totalPages / chunkCount));

    const fallbackSections: OutlineItem[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length === 0) continue;
      const firstLine = chunk[0].split('\n')[0].replace(/^[#\s*]+/, '').trim();
      const title = firstLine.length > 30 ? firstLine.slice(0, 27) + '...' : firstLine || `제 ${i + 1}장`;
      const sliceText = chunk.join('\n\n');
      const pStart = i * pChunk + 1;
      const pEnd = i === chunkCount - 1 ? totalPages : Math.min(totalPages, (i + 1) * pChunk);

      fallbackSections.push({
        id: `outline-${i + 1}`,
        order: i + 1,
        title,
        topicTags: extractQuickTags(sliceText, title),
        estimatedMinutes: Math.max(3, Math.ceil(sliceText.length / 400)),
        pageStart: pStart,
        pageEnd: pEnd,
        pageRange: `p. ${pStart} ~ ${pEnd}`,
        contentSlice: sliceText,
      });
    }
    return fallbackSections;
  }

  return sections.map((sec, idx) => {
    const sliceText = sec.contents.join('\n');
    const pStart = idx * pagesPerSec + 1;
    const pEnd = idx === sections.length - 1 ? totalPages : Math.min(totalPages, (idx + 1) * pagesPerSec);
    return {
      id: `outline-${idx + 1}`,
      order: idx + 1,
      title: sec.title,
      topicTags: extractQuickTags(sliceText, sec.title),
      estimatedMinutes: Math.max(3, Math.ceil(sliceText.length / 400)),
      pageStart: pStart,
      pageEnd: pEnd,
      pageRange: `p. ${pStart} ~ ${pEnd}`,
      contentSlice: sliceText,
    };
  });
}

function extractQuickTags(text: string, title: string): string[] {
  const words = `${title} ${text}`.match(/[가-힣A-Za-z]{2,10}/g) || [];
  const freq: Record<string, number> = {};
  const stopWords = new Set(['있다', '하는', '위해', '대한', '통해', '경우', '따라', '이를', '수', '등', '이', '그', '저', 'and', 'the', 'for', 'with', 'from', 'that']);
  for (const w of words) {
    if (stopWords.has(w.toLowerCase()) || w.length < 2) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
}

/**
 * Gemini / OpenAI LLM 호출을 통한 목차 자동 구조화, 토픽 태그 및 페이지 범위 산출
 */
export async function generateOutlinesWithAI(fullText: string, totalPages = 20): Promise<OutlineItem[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `당신은 강의자료 PDF 분석 및 목차 구조화 전문가입니다.
주어진 강의자료 전체 텍스트를 분석하여, 챕터/섹션 단위의 목차 목록과 각 목차에 해당하는 실제 원문 텍스트(contentSlice), 그리고 학습자가 한눈에 단원 내용을 파악할 수 있는 핵심 키워드 태그(topicTags) 2~4개와 예상 학습 시간(estimatedMinutes: 3~15)을 추출하세요.

[목차 가독성 원칙]
- 목차 제목(title)은 불필요하게 장황하지 않고 직관적인 '챕터 번호. 핵심 명사형 제목'으로 정제하세요.
- 원문이 영어인 경우에도 목차 제목은 전문적인 한국어로 번역 및 정리하세요 (필요 시 영문 병기).
- 각 목차마다 해당 단원에서 다루는 가장 핵심적인 전공 키워드 2~4개를 topicTags 배열에 담으세요 (예: ["프로세스", "PCB", "문맥교환"]).

[규칙]
1. 원문에 없는 내용을 절대 지어내지 마세요.
2. 각 목차의 contentSlice는 반드시 해당 목차 범위의 원문 텍스트를 그대로 포함해야 합니다.
3. 목차 수는 3개~8개 사이로 적절히 분할하세요.
4. 반드시 유효한 JSON 형식으로만 응답하세요:
{
  "outlines": [
    {
      "title": "1. 운영체제 개요 및 프로세스 관리 (OS Architecture & Processes)",
      "topicTags": ["프로세스", "PCB", "문맥교환"],
      "estimatedMinutes": 5,
      "contentSlice": "해당 목차의 실제 원문 텍스트 내용..."
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
            contents: [{ parts: [{ text: `${systemPrompt}\n\n[강의자료 원문]\n${fullText.slice(0, 30000)}` }] }],
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
      const validated = OutlineResponseSchema.parse(parsed);
      const totalCount = validated.outlines.length;
      const pagesPerCh = Math.max(1, Math.round(totalPages / totalCount));

      return validated.outlines.map((item, idx) => {
        const pStart = idx * pagesPerCh + 1;
        const pEnd = idx === totalCount - 1 ? totalPages : Math.min(totalPages, (idx + 1) * pagesPerCh);
        return {
          id: `outline-${idx + 1}`,
          order: idx + 1,
          title: item.title,
          topicTags: item.topicTags && item.topicTags.length > 0 ? item.topicTags : extractQuickTags(item.contentSlice, item.title),
          estimatedMinutes: item.estimatedMinutes || Math.max(3, Math.ceil(item.contentSlice.length / 400)),
          pageStart: pStart,
          pageEnd: pEnd,
          pageRange: `p. ${pStart} ~ ${pEnd}`,
          contentSlice: item.contentSlice,
        };
      });
    } catch (e) {
      console.warn('Gemini LLM call failed, falling back to rule engine:', e);
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
            { role: 'user', content: `[강의자료 원문]\n${fullText.slice(0, 30000)}` },
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
      const validated = OutlineResponseSchema.parse(parsed);
      const totalCount = validated.outlines.length;
      const pagesPerCh = Math.max(1, Math.round(totalPages / totalCount));

      return validated.outlines.map((item, idx) => {
        const pStart = idx * pagesPerCh + 1;
        const pEnd = idx === totalCount - 1 ? totalPages : Math.min(totalPages, (idx + 1) * pagesPerCh);
        return {
          id: `outline-${idx + 1}`,
          order: idx + 1,
          title: item.title,
          topicTags: item.topicTags && item.topicTags.length > 0 ? item.topicTags : extractQuickTags(item.contentSlice, item.title),
          estimatedMinutes: item.estimatedMinutes || Math.max(3, Math.ceil(item.contentSlice.length / 400)),
          pageStart: pStart,
          pageEnd: pEnd,
          pageRange: `p. ${pStart} ~ ${pEnd}`,
          contentSlice: item.contentSlice,
        };
      });
    } catch (e) {
      console.warn('OpenAI LLM call failed, falling back to rule engine:', e);
    }
  }

  // API 키가 없거나 LLM 실패 시 고도화된 Fallback 규칙 엔진 실행
  const ruleOutlines = extractOutlinesWithRuleEngine(fullText, totalPages);
  if (ruleOutlines.length === 0) {
    throw new Error('NO_OUTLINE_FOUND');
  }
  return ruleOutlines;
}
