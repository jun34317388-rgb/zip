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

    const systemPrompt = `당신은 강의자료 핵심 요약 전문가입니다.
주어진 목차 본문(contentSlice)만을 바탕으로 핵심 개념, 정의, 중요 원리를 압축한 불릿 목록 5~10개를 작성하세요.

[다국어 및 번역 규칙 (중요)]
- 원문 텍스트가 영어(English) 또는 다국어로 작성된 경우에도, 모든 요약 불릿은 반드시 자연스럽고 전문적인 '한국어(Korean)'로 번역 및 정리하여 출력하세요.
- 전공 학술 용어는 '한국어 번역어 (영문 원어)' 형태로 표기하면 이해에 더욱 좋습니다.

[규칙]
1. 원문에 없는 내용을 절대 지어내지 마세요.
2. 각 불릿은 '- '로 시작하여 한 줄씩 한국어로 출력하세요.
3. 단순한 한 줄 요약이 아닌, 제3자에게 핵심 개념을 설명할 수 있는 고밀도 한국어 불릿 5~8개로 구성하세요.
4. 다른 인사말이나 서론 없이 오직 '- [한국어 불릿 내용]' 형태의 불릿 목록만 출력하세요.`;

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
