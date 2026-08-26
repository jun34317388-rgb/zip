'use client';

import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ExceptionKey,
  OutlineItem,
  PDFExtractResult,
  PRD_ERROR_MESSAGES,
  QuizItem,
  TopicDetailCache,
} from '@/lib/types';
import { validateFilePreUpload } from '@/lib/pdf/validator';
import { extractTextFromPDF } from '@/lib/pdf/extractor';

type View = 'upload' | 'outline' | 'detail';

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Page() {
  const [view, setView] = useState<View>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PDFExtractResult | null>(null);
  const [outlines, setOutlines] = useState<OutlineItem[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<OutlineItem | null>(null);
  const [cache, setCache] = useState<Record<string, TopicDetailCache>>({});

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDelayed, setLoadingDelayed] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [uploadError, setUploadError] = useState<ExceptionKey>('none');
  const [detailError, setDetailError] = useState<ExceptionKey>('none');
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<'summary' | 'quiz'>('summary');
  const [adding, setAdding] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const chooseFile = (next: File | undefined) => {
    if (!next) return;
    const check = validateFilePreUpload(next);
    if (!check.isValid) {
      setUploadError(check.errorKey);
      return;
    }
    setUploadError('none');
    setFile(next);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  // 목차 구조화 API 호출 (1회 자동 재시도)
  const fetchOutlineWithRetry = async (text: string, isRetry = false): Promise<OutlineItem[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullText: text, fileName: file?.name }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (!isRetry && res.status >= 500) {
          return await fetchOutlineWithRetry(text, true);
        }
        throw new Error(errData.errorKey || 'AI_FAILED_OUTLINE');
      }

      const data = await res.json();
      if (!data.success || !data.outlines || data.outlines.length === 0) {
        if (!isRetry) return await fetchOutlineWithRetry(text, true);
        throw new Error('NO_OUTLINE_FOUND');
      }

      return data.outlines;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('AI_TIMEOUT');
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) throw new Error('NETWORK_ERROR');
      if (!isRetry && err.message !== 'AI_TIMEOUT' && err.message !== 'NETWORK_ERROR') {
        return await fetchOutlineWithRetry(text, true);
      }
      throw err;
    }
  };

  const startAnalysis = async () => {
    if (!file) {
      setUploadError('EMPTY_FILE');
      return;
    }

    setLoading(true);
    setLoadingDelayed(false);
    setUploadError('none');

    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      setLoadingDelayed(true);
    }, 3000);

    try {
      const outcome = await extractTextFromPDF(file);
      if (!outcome.success) {
        if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
        setUploadError(outcome.errorKey);
        setLoading(false);
        setLoadingDelayed(false);
        return;
      }

      const extracted = outcome.data!;
      setPdfData(extracted);

      const generatedOutlines = await fetchOutlineWithRetry(extracted.fullText);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);

      setOutlines(generatedOutlines);
      setLoading(false);
      setLoadingDelayed(false);
      setView('outline');
    } catch (err: any) {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      console.error('Analysis error:', err);
      const key: ExceptionKey =
        err.message in PRD_ERROR_MESSAGES ? (err.message as ExceptionKey) : 'AI_FAILED_OUTLINE';
      setUploadError(key);
      setLoading(false);
      setLoadingDelayed(false);
    }
  };

  // 온디맨드 요약 로드 (캐시 우선)
  const loadSummaryForOutline = async (outline: OutlineItem, isRetry = false) => {
    const existing = cache[outline.id]?.summary;
    if (existing && existing.length > 0) return;

    setContentLoading(true);
    setDetailError('none');

    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentSlice: outline.contentSlice, title: outline.title }),
      });

      if (!res.ok) {
        if (!isRetry) return await loadSummaryForOutline(outline, true);
        throw new Error('AI_FAILED_SUMMARY');
      }

      const data = await res.json();
      if (!data.success || !data.bullets) {
        if (!isRetry) return await loadSummaryForOutline(outline, true);
        throw new Error('AI_FAILED_SUMMARY');
      }

      setCache((prev) => ({
        ...prev,
        [outline.id]: {
          ...(prev[outline.id] || { quizzes: [], userAnswers: {} }),
          summary: data.bullets,
        },
      }));
      setContentLoading(false);
    } catch (err: any) {
      console.error('Summary load error:', err);
      setDetailError(err.message === 'NETWORK_ERROR' ? 'NETWORK_ERROR' : 'AI_FAILED_SUMMARY');
      setContentLoading(false);
    }
  };

  // 온디맨드 퀴즈 로드 (캐시 우선)
  const loadQuizForOutline = async (outline: OutlineItem, isRetry = false) => {
    const existing = cache[outline.id]?.quizzes;
    if (existing && existing.length > 0) return;

    setContentLoading(true);
    setDetailError('none');

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentSlice: outline.contentSlice, title: outline.title }),
      });

      if (!res.ok) {
        if (!isRetry) return await loadQuizForOutline(outline, true);
        throw new Error('AI_FAILED_QUIZ');
      }

      const data = await res.json();
      if (!data.success || !data.quizzes) {
        if (!isRetry) return await loadQuizForOutline(outline, true);
        throw new Error('AI_FAILED_QUIZ');
      }

      setCache((prev) => ({
        ...prev,
        [outline.id]: {
          ...(prev[outline.id] || { quizzes: [], userAnswers: {} }),
          quizzes: data.quizzes,
        },
      }));
      setContentLoading(false);
    } catch (err: any) {
      console.error('Quiz load error:', err);
      setDetailError(err.message === 'NETWORK_ERROR' ? 'NETWORK_ERROR' : 'AI_FAILED_QUIZ');
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'detail' && selectedOutline) {
      if (tab === 'summary') {
        loadSummaryForOutline(selectedOutline);
      } else if (tab === 'quiz') {
        loadQuizForOutline(selectedOutline);
      }
    }
  }, [view, selectedOutline, tab]);

  const answerQuiz = (qIndex: number, optionIndex: number) => {
    if (!selectedOutline) return;
    setCache((prev) => {
      const currentTopic = prev[selectedOutline.id] || { quizzes: [], userAnswers: {} };
      if (currentTopic.userAnswers[qIndex] !== undefined) return prev;
      return {
        ...prev,
        [selectedOutline.id]: {
          ...currentTopic,
          userAnswers: {
            ...currentTopic.userAnswers,
            [qIndex]: optionIndex,
          },
        },
      };
    });
  };

  // 문제 더 풀기 (중복 억제 및 기존 상태 보존 머지)
  const addMore = async () => {
    if (!selectedOutline) return;
    setAdding(true);
    setDetailError('none');

    const currentQuizzes = cache[selectedOutline.id]?.quizzes || [];
    const existingQuestions = currentQuizzes.map((q) => q.question);

    try {
      const res = await fetch('/api/ai/quiz-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSlice: selectedOutline.contentSlice,
          title: selectedOutline.title,
          existingQuestions,
        }),
      });

      if (!res.ok) throw new Error('QUIZ_MORE_FAILED');
      const data = await res.json();
      if (!data.success || !data.quizzes || data.quizzes.length === 0) {
        throw new Error('QUIZ_MORE_FAILED');
      }

      setCache((prev) => {
        const topic = prev[selectedOutline.id] || { quizzes: [], userAnswers: {} };
        return {
          ...prev,
          [selectedOutline.id]: {
            ...topic,
            quizzes: [...topic.quizzes, ...data.quizzes],
          },
        };
      });
      setAdding(false);
    } catch (err: any) {
      console.error('Quiz-more error:', err);
      setDetailError('QUIZ_MORE_FAILED');
      setAdding(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPdfData(null);
    setOutlines([]);
    setSelectedOutline(null);
    setCache({});
    setUploadError('none');
    setDetailError('none');
    setView('upload');
  };

  const fileLabel = file?.name ?? '강의자료.pdf';
  const currentTopicCache = selectedOutline ? cache[selectedOutline.id] : undefined;
  const currentSummaries = currentTopicCache?.summary || [];
  const currentQuizzes = currentTopicCache?.quizzes || [];
  const currentAnswers = currentTopicCache?.userAnswers || {};
  const completed = Object.keys(currentAnswers).length;

  const simulatedError =
    uploadError !== 'none'
      ? PRD_ERROR_MESSAGES[uploadError]
      : detailError !== 'none'
      ? PRD_ERROR_MESSAGES[detailError]
      : '없음';

  return (
    <div className={dark ? 'dark min-h-screen bg-background text-foreground' : 'min-h-screen bg-background text-foreground'}>
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <button
            onClick={() => setView('upload')}
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileText aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">강의자료 목차 요약·퀴즈</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={dark ? '라이트 모드' : '다크 모드'}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun data-icon="inline-start" /> : <Moon data-icon="inline-start" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col px-5 py-10 sm:py-16">
        {view === 'upload' && (
          <UploadView
            file={file}
            dragging={dragging}
            setDragging={setDragging}
            chooseFile={chooseFile}
            onDrop={onDrop}
            loading={loading}
            loadingDelayed={loadingDelayed}
            startAnalysis={startAnalysis}
            error={uploadError}
            clearFile={() => {
              setFile(null);
              setUploadError('none');
            }}
            retry={startAnalysis}
          />
        )}
        {view === 'outline' && (
          <OutlineView
            fileLabel={fileLabel}
            pageCount={pdfData?.pageCount}
            charCount={pdfData?.totalCharacters}
            outlines={outlines}
            setView={setView}
            onReset={resetAll}
            onSelect={(outline) => {
              setSelectedOutline(outline);
              setView('detail');
            }}
          />
        )}
        {view === 'detail' && selectedOutline && (
          <DetailView
            outline={selectedOutline}
            tab={tab}
            setTab={setTab}
            setView={setView}
            detailError={detailError}
            setDetailError={setDetailError}
            loading={contentLoading}
            summaries={currentSummaries}
            quizzes={currentQuizzes}
            answers={currentAnswers}
            answer={answerQuiz}
            completed={completed}
            adding={adding}
            addMore={addMore}
            retry={() => {
              if (tab === 'summary') loadSummaryForOutline(selectedOutline);
              else if (detailError === 'QUIZ_MORE_FAILED') addMore();
              else loadQuizForOutline(selectedOutline);
            }}
          />
        )}
      </main>

      <DevPanel
        open={panelOpen}
        setOpen={setPanelOpen}
        view={view}
        setView={setView}
        loading={loading}
        setLoading={setLoading}
        uploadError={uploadError}
        setUploadError={setUploadError}
        detailError={detailError}
        setDetailError={setDetailError}
        simulatedError={simulatedError}
      />
    </div>
  );
}

function UploadView({
  file,
  dragging,
  setDragging,
  chooseFile,
  onDrop,
  loading,
  loadingDelayed,
  startAnalysis,
  error,
  clearFile,
  retry,
}: {
  file: File | null;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  chooseFile: (f?: File) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  loading: boolean;
  loadingDelayed: boolean;
  startAnalysis: () => void;
  error: ExceptionKey;
  clearFile: () => void;
  retry: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center animate-in">
      <div className="mb-10 max-w-lg">
        <p className="mb-3 text-sm font-medium text-primary">학습 자료를 정리해보세요</p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          강의자료에서 핵심만<br className="hidden sm:block" /> 빠르게 찾아보세요
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">PDF를 올리면 목차별 요약과 퀴즈를 만들어드려요.</p>
      </div>

      <input
        id="pdf-input"
        className="sr-only"
        type="file"
        accept="application/pdf"
        onChange={(e: ChangeEvent<HTMLInputElement>) => chooseFile(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="PDF 파일 업로드 영역"
        onClick={() => document.getElementById('pdf-input')?.click()}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') document.getElementById('pdf-input')?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full rounded-2xl border-2 border-dashed p-8 transition-all sm:p-12 ${
          dragging
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {file ? (
          <div className="mx-auto flex max-w-md items-center gap-4 rounded-xl border border-border bg-background p-4 text-left shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="선택한 파일 삭제"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              <Trash2 data-icon="inline-start" />
            </Button>
          </div>
        ) : (
          <>
            <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload size={25} />
            </span>
            <p className="font-semibold">PDF 파일을 여기에 끌어다 놓으세요</p>
            <p className="mt-2 text-sm text-muted-foreground">또는 클릭해서 파일 선택</p>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        텍스트가 포함된 PDF만 지원해요 · 최대 20MB · 20~40페이지 권장
      </p>

      {error !== 'none' && (
        <div
          role="alert"
          className="mt-6 flex w-full items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 shrink-0" />
          <p className="flex-1 leading-6">{PRD_ERROR_MESSAGES[error]}</p>
          <Button variant="ghost" size="sm" onClick={retry}>
            다시 시도
          </Button>
        </div>
      )}

      <Button
        size="lg"
        className="mt-8 w-full max-w-md"
        disabled={loading || !file}
        onClick={startAnalysis}
      >
        {loading ? (
          <>
            <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            목차를 분석하고 있습니다...
          </>
        ) : (
          '업로드 및 분석 시작'
        )}
      </Button>

      {loading && loadingDelayed && (
        <p className="mt-3 text-sm text-muted-foreground animate-in fade-in">
          분석에 시간이 걸리고 있어요. 잠시만 기다려주세요.
        </p>
      )}
    </section>
  );
}

function OutlineView({
  fileLabel,
  pageCount,
  charCount,
  outlines,
  setView,
  onReset,
  onSelect,
}: {
  fileLabel: string;
  pageCount?: number;
  charCount?: number;
  outlines: OutlineItem[];
  setView: (v: View) => void;
  onReset: () => void;
  onSelect: (item: OutlineItem) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-2xl animate-in">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">분석이 완료되었어요</p>
          <h1 className="truncate text-xl font-bold sm:text-2xl">{fileLabel}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {pageCount ? `${pageCount}페이지 (${charCount?.toLocaleString()}자) · ` : ''}목차 {outlines.length}개를 찾았어요
          </p>
        </div>
        <Button variant="outline" className="shrink-0" onClick={onReset}>
          <Upload data-icon="inline-start" />
          새 PDF 업로드
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {outlines.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex items-center gap-5 rounded-xl border border-border bg-card px-5 py-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex-1 text-sm font-medium sm:text-base">{item.title}</span>
            <ChevronRight className="text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </section>
  );
}

function DetailView({
  outline,
  tab,
  setTab,
  setView,
  detailError,
  setDetailError,
  loading,
  summaries,
  quizzes,
  answers,
  answer,
  completed,
  adding,
  addMore,
  retry,
}: {
  outline: OutlineItem;
  tab: 'summary' | 'quiz';
  setTab: (v: 'summary' | 'quiz') => void;
  setView: (v: View) => void;
  detailError: ExceptionKey;
  setDetailError: (v: ExceptionKey) => void;
  loading: boolean;
  summaries: string[];
  quizzes: QuizItem[];
  answers: Record<number, number>;
  answer: (q: number, o: number) => void;
  completed: number;
  adding: boolean;
  addMore: () => void;
  retry: () => void;
}) {
  const canAdd = quizzes.length > 0 && completed === quizzes.length;

  return (
    <section className="mx-auto w-full max-w-2xl animate-in">
      <Button variant="ghost" className="mb-8 -ml-3 text-muted-foreground" onClick={() => setView('outline')}>
        <ArrowLeft data-icon="inline-start" />
        목록으로 돌아가기
      </Button>
      <p className="mb-2 text-sm text-primary">목차 {outline.order}</p>
      <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{outline.title}</h1>

      <div className="mt-8 grid grid-cols-2 rounded-xl border border-border bg-muted p-1">
        <button
          aria-selected={tab === 'summary'}
          onClick={() => setTab('summary')}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tab === 'summary' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          요약 보기
        </button>
        <button
          aria-selected={tab === 'quiz'}
          onClick={() => setTab('quiz')}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tab === 'quiz' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          퀴즈 풀기
        </button>
      </div>

      {tab === 'summary' ? (
        <Summary
          summaries={summaries}
          error={detailError === 'AI_FAILED_SUMMARY'}
          loading={loading}
          retry={retry}
        />
      ) : (
        <QuizView
          quizzes={quizzes}
          answers={answers}
          answer={answer}
          completed={completed}
          canAdd={canAdd}
          adding={adding}
          loading={loading}
          error={detailError === 'AI_FAILED_QUIZ' || detailError === 'QUIZ_MORE_FAILED'}
          addMore={addMore}
          retry={retry}
        />
      )}
    </section>
  );
}

function Summary({
  summaries,
  loading,
  error,
  retry,
}: {
  summaries: string[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="mt-8 flex flex-col gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonLine />
            <SkeletonLine wide={i % 2 === 0} />
          </div>
        ))}
      </div>
    );

  if (error) return <ErrorBox message={PRD_ERROR_MESSAGES.AI_FAILED_SUMMARY} retry={retry} />;

  return (
    <ul className="mt-8 flex flex-col gap-5">
      {summaries.map((text, idx) => (
        <li key={idx} className="flex gap-4 text-sm leading-7 text-foreground/85 sm:text-base">
          <span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" />
          {text}
        </li>
      ))}
    </ul>
  );
}

function SkeletonLine({ wide = false }: { wide?: boolean }) {
  return <div className={`h-5 animate-pulse rounded-md bg-muted ${wide ? 'w-full' : 'w-3/4'}`} />;
}

function QuizView({
  quizzes,
  answers,
  answer,
  completed,
  canAdd,
  adding,
  loading,
  error,
  addMore,
  retry,
}: {
  quizzes: QuizItem[];
  answers: Record<number, number>;
  answer: (q: number, o: number) => void;
  completed: number;
  canAdd: boolean;
  adding: boolean;
  loading: boolean;
  error: boolean;
  addMore: () => void;
  retry: () => void;
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
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-7">
      <div className="mb-7">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">진행도</span>
          <span className="text-muted-foreground">
            {completed} / {quizzes.length} 문항 완료
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${quizzes.length > 0 ? (completed / quizzes.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error ? (
        <ErrorBox
          message={
            completed === quizzes.length
              ? PRD_ERROR_MESSAGES.QUIZ_MORE_FAILED
              : PRD_ERROR_MESSAGES.AI_FAILED_QUIZ
          }
          retry={retry}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {quizzes.map((quiz, q) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              index={q}
              selected={answers[q]}
              onAnswer={(o) => answer(q, o)}
            />
          ))}
          {adding && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="flex flex-col gap-3">
                <SkeletonLine />
                <SkeletonLine wide />
                <SkeletonLine />
              </div>
            </div>
          )}
        </div>
      )}

      {canAdd && !adding && !error && (
        <Button variant="outline" className="mt-7 w-full" onClick={addMore}>
          <RotateCcw data-icon="inline-start" />
          문제 더 풀기
        </Button>
      )}

      {adding && (
        <Button disabled className="mt-7 w-full">
          <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          새 문제를 만들고 있어요
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
}: {
  quiz: QuizItem;
  index: number;
  selected?: number;
  onAnswer: (o: number) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">문제 {index + 1}</p>
      <h2 className="text-base font-semibold leading-7">{quiz.question}</h2>
      <div className="mt-5 flex flex-col gap-2">
        {quiz.options.map((option, i) => {
          const chosen = selected === i;
          const correct = selected !== undefined && i === quiz.answer;
          const wrong = chosen && !correct;

          return (
            <button
              key={option}
              disabled={selected !== undefined}
              onClick={() => onAnswer(i)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${
                correct
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : wrong
                  ? 'border-destructive/50 bg-destructive/10 text-destructive'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/30 text-xs">
                {correct ? (
                  <Check data-icon="inline-start" />
                ) : wrong ? (
                  <X data-icon="inline-start" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {selected !== undefined && (
        <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
          {quiz.explanation}
        </p>
      )}
    </article>
  );
}

function ErrorBox({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div
      role="alert"
      className="mt-8 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      <AlertCircle className="shrink-0" />
      <span className="flex-1 leading-6">{message}</span>
      <Button variant="ghost" size="sm" onClick={retry}>
        다시 시도
      </Button>
    </div>
  );
}

function DevPanel({
  open,
  setOpen,
  view,
  setView,
  loading,
  setLoading,
  uploadError,
  setUploadError,
  detailError,
  setDetailError,
  simulatedError,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  view: View;
  setView: (v: View) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  uploadError: ExceptionKey;
  setUploadError: (v: ExceptionKey) => void;
  detailError: ExceptionKey;
  setDetailError: (v: ExceptionKey) => void;
  simulatedError: string;
}) {
  return (
    <aside className="fixed bottom-4 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card/95 p-3 text-xs shadow-lg backdrop-blur">
      <button
        className="flex w-full items-center justify-between font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>개발용 상태 스위처</span>
        <span>{open ? '접기' : '열기'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          <label className="flex items-center justify-between gap-3">
            뷰 상태
            <select
              value={view}
              onChange={(e) => setView(e.target.value as View)}
              className="rounded-md border border-input bg-background px-2 py-1"
            >
              <option value="upload">업로드 (뷰 A)</option>
              <option value="outline">목차 목록 (뷰 B)</option>
              <option value="detail">상세 (뷰 C)</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            로딩 인디케이터
            <input type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} />
          </label>
          <label className="flex flex-col gap-1">
            업로드 오류 시뮬레이션
            <select
              value={uploadError}
              onChange={(e) => setUploadError(e.target.value as ExceptionKey)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="none">없음</option>
              <option value="EMPTY_FILE">5.1 빈 파일 / 미선택</option>
              <option value="INVALID_FILE_TYPE">5.2 확장자/MIME 불일치</option>
              <option value="CORRUPTED_PDF">5.2 손상된 파일</option>
              <option value="FILE_TOO_LARGE">5.3 용량/페이지 초과</option>
              <option value="NO_TEXT_EXTRACTED">5.4 스캔본/텍스트 없음</option>
              <option value="AI_FAILED_OUTLINE">5.5 목차 분석 실패</option>
              <option value="AI_TIMEOUT">5.6 타임아웃</option>
              <option value="NO_OUTLINE_FOUND">5.7 목차 인식 실패</option>
              <option value="NETWORK_ERROR">5.9 네트워크 에러</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            상세 오류 시뮬레이션
            <select
              value={detailError}
              onChange={(e) => setDetailError(e.target.value as ExceptionKey)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="none">없음</option>
              <option value="AI_FAILED_SUMMARY">5.5 요약 생성 실패</option>
              <option value="AI_FAILED_QUIZ">5.5 퀴즈 생성 실패</option>
              <option value="QUIZ_MORE_FAILED">5.8 추가 문제 생성 실패</option>
              <option value="AI_TIMEOUT">5.6 타임아웃</option>
              <option value="NETWORK_ERROR">5.9 네트워크 에러</option>
            </select>
          </label>
          <div className="rounded bg-muted p-2 text-[11px] leading-relaxed text-muted-foreground">
            <strong>현재 메시지:</strong> {simulatedError}
          </div>
        </div>
      )}
    </aside>
  );
}
