import { NextRequest, NextResponse } from 'next/server';
import { generateSummaryWithAI } from '@/lib/ai/summary-service';
import { ExceptionKey, PRD_ERROR_MESSAGES } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentSlice, title } = body;

    if (!contentSlice || typeof contentSlice !== 'string' || contentSlice.trim().length < 10) {
      const errorKey: ExceptionKey = 'NO_TEXT_EXTRACTED';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 400 }
      );
    }

    const bullets = await generateSummaryWithAI(contentSlice, title);

    if (!bullets || bullets.length === 0) {
      const errorKey: ExceptionKey = 'AI_FAILED_SUMMARY';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bullets,
    });
  } catch (error: any) {
    console.error('Summary API error:', error);
    const errorKey: ExceptionKey = 'AI_FAILED_SUMMARY';
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
