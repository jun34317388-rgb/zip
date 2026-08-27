'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Loader2, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBox } from '@/components/error-box';
import { ExceptionKey, OutlineItem, QuizItem, View } from '@/lib/types';

interface DetailViewProps {
  outline: OutlineItem;
  tab: 'summary' | 'quiz';
  setTab: (v: 'summary' | 'quiz') => void;
  setView: (v: View) => void;
  detailError: ExceptionKey;
  setDetailError: (v: ExceptionKey) => void;
  loading: boolean;
  streamingText?: string;
  isStreaming?: boolean;
  summaries: string[];
  quizzes: QuizItem[];
  answers: Record<number, number>;
  answer: (q: number, o: number) => void;
  completed: number;
  adding: boolean;
  addMore: () => void;
  retry: () => void;
}

export function DetailView({
  outline,
  tab,
  setTab,
  setView,
  detailError,
  loading,
  streamingText = '',
  isStreaming = false,
  summaries,
  quizzes,
  answers,
  answer,
  completed,
  adding,
  addMore,
  retry,
}: DetailViewProps) {
  const canAdd = quizzes.length > 0 && completed === quizzes.length;

  return (
    <section className="mx-auto w-full max-w-2xl animate-in">
      <Button
        variant="ghost"
        className="mb-6 -ml-3 text-muted-foreground hover:text-foreground gap-2"
        onClick={() => setView('outline')}
      >
        <ArrowLeft className="size-4" />
        목록으로 돌아가기
      </Button>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        목차 {outline.order}
      </p>
      <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
        {outline.title}
      </h1>

      <div className="mt-8 grid grid-cols-2 rounded-xl border border-border bg-muted p-1">
        <button
          aria-selected={tab === 'summary'}
          role="tab"
          onClick={() => setTab('summary')}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tab === 'summary'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          요약 보기
        </button>
        <button
          aria-selected={tab === 'quiz'}
          role="tab"
          onClick={() => setTab('quiz')}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tab === 'quiz'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          퀴즈 풀기
        </button>
      </div>

      {tab === 'summary' ? (
        <SummarySection
          summaries={summaries}
          streamingText={streamingText}
          isStreaming={isStreaming}
          errorKey={detailError}
          loading={loading}
          retry={retry}
        />
      ) : (
        <QuizSection
          quizzes={quizzes}
          answers={answers}
          answer={answer}
          completed={completed}
          canAdd={canAdd}
          adding={adding}
          loading={loading}
          errorKey={detailError}
          addMore={addMore}
          retry={retry}
          contentSlice={outline.contentSlice}
          title={outline.title}
        />
      )}
    </section>
  );
}

function SummarySection({
  summaries,
  streamingText,
  isStreaming,
  loading,
  errorKey,
  retry,
}: {
  summaries: string[];
  streamingText: string;
  isStreaming: boolean;
  loading: boolean;
  errorKey: ExceptionKey;
  retry: () => void;
}) {
  // 스트리밍 텍스트 파싱
  const parsedStreamingBullets = streamingText
    ? streamingText
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
        .filter(Boolean)
    : [];

  const displayBullets = summaries.length > 0 ? summaries : parsedStreamingBullets;

  if (loading && displayBullets.length === 0 && !isStreaming) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <span className="size-2 shrink-0 rounded-full bg-muted animate-pulse" />
            <SkeletonLine wide={i % 2 === 0} />
          </div>
        ))}
      </div>
    );
  }

  if (errorKey !== 'none' && displayBullets.length === 0) {
    return (
      <div className="mt-8">
        <ErrorBox errorKey={errorKey} retry={retry} />
      </div>
    );
  }

  return (
    <div className="mt-8">
      {isStreaming && (
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-primary animate-pulse">
          <Loader2 className="size-3.5 animate-spin" />
          <span>실시간으로 핵심 요약을 작성하고 있습니다...</span>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {displayBullets.map((text, idx) => (
          <li key={idx} className="flex gap-4 text-sm leading-7 text-foreground/90 sm:text-base animate-in fade-in">
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
            <span className="flex-1">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkeletonLine({ wide = false }: { wide?: boolean }) {
  return <div className={`h-5 animate-pulse rounded-md bg-muted ${wide ? 'w-full' : 'w-3/4'}`} />;
}

function QuizSection({
  quizzes,
  answers,
  answer,
  completed,
  canAdd,
  adding,
  loading,
  errorKey,
  addMore,
  retry,
  contentSlice,
  title,
}: {
  quizzes: QuizItem[];
  answers: Record<number, number>;
  answer: (q: number, o: number) => void;
  completed: number;
  canAdd: boolean;
  adding: boolean;
  loading: boolean;
  errorKey: ExceptionKey;
  addMore: () => void;
  retry: () => void;
  contentSlice?: string;
  title?: string;
}) {
  if (loading && quizzes.length === 0) {
    return (
      <div className="mt-8 flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="mb-6 h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="flex flex-col gap-3">
              <SkeletonLine wide />
              <SkeletonLine wide />
              <SkeletonLine wide />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-7">
      {quizzes.length > 0 && (
        <div className="mb-7">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-foreground">진행도</span>
            <span className="text-muted-foreground font-semibold">
              {completed} / {quizzes.length} 문항 완료
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(completed / quizzes.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {errorKey !== 'none' && (
        <div className="mb-6">
          <ErrorBox errorKey={errorKey} retry={retry} />
        </div>
      )}

      <div className="flex flex-col gap-5">
        {quizzes.map((quiz, q) => (
          <QuizCard
            key={quiz.id || `quiz-${q}`}
            quiz={quiz}
            index={q}
            selected={answers[q]}
            onAnswer={(o) => answer(q, o)}
            contentSlice={contentSlice}
            title={title}
          />
        ))}

        {adding && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="mb-4 h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="flex flex-col gap-3">
              <SkeletonLine wide />
              <SkeletonLine wide />
            </div>
          </div>
        )}
      </div>

      {canAdd && !adding && (
        <Button variant="outline" className="mt-8 w-full h-11 text-sm font-semibold gap-2" onClick={addMore}>
          <RotateCcw className="size-4" />
          문제 더 풀기
        </Button>
      )}

      {adding && (
        <Button disabled className="mt-8 w-full h-11 text-sm font-semibold">
          <Loader2 className="mr-2 size-4 animate-spin" />
          새 문제를 만들고 있어요...
        </Button>
      )}
    </div>
  );
}

function QuizCard({
  quiz,
  index,
  selected,
  onAnswer,
  contentSlice = '',
  title = '',
}: {
  quiz: QuizItem;
  index: number;
  selected?: number;
  onAnswer: (o: number) => void;
  contentSlice?: string;
  title?: string;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintData, setHintData] = useState<{
    whyWrong: string;
    reviewGuide: string;
    keyPoint: string;
  } | null>(null);

  const isWrong = selected !== undefined && selected !== quiz.answer;

  const fetchHint = async () => {
    if (hintData || hintLoading || selected === undefined) return;
    setHintLoading(true);
    try {
      const res = await fetch('/api/ai/quiz-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: quiz.question,
          options: quiz.options,
          selectedOption: selected,
          answer: quiz.answer,
          contentSlice,
          title,
        }),
      });
      const data = await res.json();
      if (data.success && data.hint) {
        setHintData(data.hint);
      }
    } catch {
      // ignore
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 transition-all">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
        문제 {index + 1}
      </p>
      <h2 className="text-base font-semibold leading-7 text-card-foreground">
        {quiz.question}
      </h2>
      <div className="mt-5 flex flex-col gap-2.5">
        {quiz.options.map((option, i) => {
          const chosen = selected === i;
          const isAns = selected !== undefined && i === quiz.answer;
          const isWr = chosen && !isAns;

          return (
            <button
              key={option}
              disabled={selected !== undefined}
              onClick={() => onAnswer(i)}
              className={`flex items-center gap-3.5 rounded-lg border px-4 py-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${
                isAns
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium'
                  : isWr
                  ? 'border-destructive/60 bg-destructive/10 text-destructive font-medium'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent/40 text-foreground'
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  isAns
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isWr
                    ? 'border-destructive bg-destructive text-white'
                    : 'border-muted-foreground/40 text-muted-foreground'
                }`}
              >
                {isAns ? (
                  <Check className="size-3.5 stroke-[3]" />
                ) : isWr ? (
                  <X className="size-3.5 stroke-[3]" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="flex-1 leading-6">{option}</span>
            </button>
          );
        })}
      </div>

      {selected !== undefined && (
        <div className="mt-4 rounded-lg border border-border/80 bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">💡 정답 해설</p>
          <p>{quiz.explanation}</p>

          {/* Sprint 8 오답 맞춤형 힌트 섹션 */}
          {isWrong && (
            <div className="mt-3 pt-3 border-t border-border/70">
              {!hintOpen ? (
                <button
                  onClick={() => {
                    setHintOpen(true);
                    fetchHint();
                  }}
                  className="flex items-center gap-1.5 text-primary font-semibold hover:underline"
                >
                  <span>🧠 AI 맞춤 오답 분석 & 복습 가이드 보기</span>
                </button>
              ) : (
                <div className="mt-2 rounded-md bg-background/80 p-3 border border-primary/20 animate-in fade-in">
                  <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                    <span>🔍 AI 오답 분석</span>
                    {hintLoading && <Loader2 className="size-3 animate-spin text-primary" />}
                  </p>
                  {hintLoading ? (
                    <p className="text-[11px] text-muted-foreground">오답 원인을 분석하고 있습니다...</p>
                  ) : hintData ? (
                    <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-foreground">
                      <p>
                        <strong>• 오답 원인:</strong> {hintData.whyWrong}
                      </p>
                      <p>
                        <strong>• 복습 포인트:</strong> {hintData.reviewGuide}
                      </p>
                      <p className="text-primary font-medium">
                        <strong>• 핵심 요약:</strong> {hintData.keyPoint}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
