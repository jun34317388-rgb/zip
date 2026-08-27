import { NextRequest, NextResponse } from 'next/server';
import { generateQuizzesWithAI } from '@/lib/ai/quiz-service';
import { filterDuplicateQuizzes } from '@/lib/ai/dedup';
import { ExceptionKey, PRD_ERROR_MESSAGES } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentSlice, title, existingQuestions = [], difficulty = 'basic' } = body;

    if (!contentSlice || typeof contentSlice !== 'string' || contentSlice.trim().length < 10) {
      const errorKey: ExceptionKey = 'NO_TEXT_EXTRACTED';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 400 }
      );
    }

    // 1차 생성 시도
    let rawQuizzes = await generateQuizzesWithAI(contentSlice, title, existingQuestions, difficulty);
    let { validQuizzes, duplicateCount } = filterDuplicateQuizzes(rawQuizzes, [...existingQuestions]);

    // 5.8: 중복이 감지되었거나 유효 문항이 0개인 경우 백그라운드 1회 자동 재요청
    if (duplicateCount > 0 && validQuizzes.length === 0) {
      console.log('Duplicates detected in quiz-more, performing 1 background auto-retry...');
      rawQuizzes = await generateQuizzesWithAI(contentSlice, title, existingQuestions, difficulty);
      const retryResult = filterDuplicateQuizzes(rawQuizzes, [...existingQuestions]);
      validQuizzes = retryResult.validQuizzes;
    }

    if (!validQuizzes || validQuizzes.length === 0) {
      const errorKey: ExceptionKey = 'QUIZ_MORE_FAILED';
      return NextResponse.json(
        { success: false, errorKey, message: PRD_ERROR_MESSAGES[errorKey] },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      quizzes: validQuizzes,
      addedCount: validQuizzes.length,
    });
  } catch (error: any) {
    console.error('Quiz-more API error:', error);
    const errorKey: ExceptionKey = 'QUIZ_MORE_FAILED';
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
