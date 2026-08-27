import { NextRequest, NextResponse } from 'next/server';
import { generateQuizzesWithAI } from '@/lib/ai/quiz-service';
import { ExceptionKey, PRD_ERROR_MESSAGES } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentSlice, title, existingQuestions, difficulty = 'basic' } = body;

    if (!contentSlice || typeof contentSlice !== 'string' || contentSlice.trim().length < 10) {
      const errorKey: ExceptionKey = 'NO_TEXT_EXTRACTED';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 400 }
      );
    }

    const quizzes = await generateQuizzesWithAI(contentSlice, title, existingQuestions, difficulty);

    if (!quizzes || quizzes.length === 0) {
      const errorKey: ExceptionKey = 'AI_FAILED_QUIZ';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    console.error('Quiz API error:', error);
    const errorKey: ExceptionKey = 'AI_FAILED_QUIZ';
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
