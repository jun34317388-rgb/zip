import { NextRequest, NextResponse } from 'next/server';
import { extractSummaryWithRuleEngine } from '@/lib/ai/summary-service';

export async function POST(req: NextRequest) {
  try {
    const { contentSlice, title } = await req.json();

    if (!contentSlice || typeof contentSlice !== 'string') {
      return NextResponse.json(
        { success: false, errorKey: 'EMPTY_FILE' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Gemini API Key가 없는 경우 Fallback 데이터를 스트리밍 형태로 전송
    if (!geminiApiKey) {
      const fallbackBullets = extractSummaryWithRuleEngine(contentSlice);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const bullet of fallbackBullets) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ bullet })}\n\n`));
            await new Promise((r) => setTimeout(r, 80));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const systemPrompt = `당신은 최고 수준의 대학 강의자료 심층 분석 및 요약 전문가입니다.
주어진 목차 본문(contentSlice)만을 꼼꼼히 분석하여, 제3자에게 핵심을 명확하고 깊이 있게 설명할 수 있는 '3-Tier 심층 구조화 요약 불릿(총 7~10개)'을 작성하세요.

[3-Tier 구조화 작성 원칙 (필수)]
1. 💡 [핵심 정의 및 개념 체계] (2~3개 불릿):
   - 해당 단원이 규정하는 핵심 용어의 명확한 정의, 목적, 필수 구성 요소 및 3대/4대 특징을 정확히 서술하세요.
2. ⚙️ [동작 원리 및 핵심 메커니즘] (3~4개 불릿):
   - 데이터 흐름, 단계별 동작 순서(1단계 ➔ 2단계 ➔ 3단계), 세부 하드웨어/소프트웨어 상호작용 원리를 구체적 사실에 근거하여 서술하세요.
3. ⚖️ [비교 분석, 트레이드오프 및 주의사항] (2~3개 불릿):
   - 타 방식/알고리즘과의 장단점 비교, 성능 트레이드오프, 실제 적용 시 주의점을 명확히 짚어주세요.

[규칙]
1. 원문에 없는 내용을 절대 지어내지 마세요.
2. 각 불릿은 '- 💡 [핵심 정의] ...', '- ⚙️ [동작 원리] ...', '- ⚖️ [비교 및 주의점] ...' 형태로 한 줄씩 한국어로 출력하세요.
3. 추상적 서술을 배제하고, 구체적인 기술 용어와 동작 메커니즘을 포함한 고밀도 불릿 7~10개를 작성하세요.
4. 다른 인사말이나 서론 없이 오직 '- [태그] [내용]' 형태의 불릿 목록만 출력하세요.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${geminiApiKey}`,
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
            temperature: 0.2,
          },
        }),
      }
    );

    if (!geminiRes.ok || !geminiRes.body) {
      // Gemini 호출 실패 시 Fallback
      const fallbackBullets = extractSummaryWithRuleEngine(contentSlice);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const bullet of fallbackBullets) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ bullet })}\n\n`));
            await new Promise((r) => setTimeout(r, 80));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';

    const customStream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (chunkText) {
                    accumulatedText += chunkText;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ chunk: chunkText, fullText: accumulatedText })}\n\n`)
                    );
                  }
                } catch {
                  // 파싱 실패 무시
                }
              }
            }
          }

          // 스트림 완료 신호
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Summary stream route error:', error);
    return NextResponse.json(
      { success: false, errorKey: 'AI_FAILED_SUMMARY', message: error.message },
      { status: 500 }
    );
  }
}
