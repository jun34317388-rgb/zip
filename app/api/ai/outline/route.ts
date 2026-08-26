import { NextRequest, NextResponse } from 'next/server';
import { generateOutlinesWithAI } from '@/lib/ai/outline-service';
import { ExceptionKey, PRD_ERROR_MESSAGES } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullText } = body;

    if (!fullText || typeof fullText !== 'string' || fullText.trim().length < 50) {
      const errorKey: ExceptionKey = 'NO_TEXT_EXTRACTED';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 400 }
      );
    }

    const outlines = await generateOutlinesWithAI(fullText);

    if (!outlines || outlines.length === 0) {
      const errorKey: ExceptionKey = 'NO_OUTLINE_FOUND';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      outlines,
    });
  } catch (error: any) {
    console.error('Outline API error:', error);
    const isNoOutline = error?.message === 'NO_OUTLINE_FOUND';
    const errorKey: ExceptionKey = isNoOutline ? 'NO_OUTLINE_FOUND' : 'AI_FAILED_OUTLINE';

    return NextResponse.json(
      {
        success: false,
        errorKey,
        message: PRD_ERROR_MESSAGES[errorKey],
      },
      { status: 500 }
    );
  }
}
