'use client';

import { useEffect, useState } from 'react';
import { FileText, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ExceptionKey,
  OutlineItem,
  PDFExtractResult,
  PRD_ERROR_MESSAGES,
  QuizDifficulty,
  TopicDetailCache,
  View,
} from '@/lib/types';
import { validateFilePreUpload } from '@/lib/pdf/validator';
import { extractTextFromPDF } from '@/lib/pdf/extractor';
import { fetchWithRetry, AppApiError } from '@/lib/api/retry-client';
import { SampleLecture } from '@/lib/sample-data';
import { UploadView } from '@/components/upload-view';
import { OutlineView } from '@/components/outline-view';
import { DetailView } from '@/components/detail-view';
import { DevPanel } from '@/components/dev-panel';

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
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadError, setUploadError] = useState<ExceptionKey>('none');
  const [detailError, setDetailError] = useState<ExceptionKey>('none');
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<'summary' | 'quiz'>('summary');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('basic');
  const [adding, setAdding] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // 5.10 분석 진행 중 이탈 방지 경고 (브라우저 기본 다이얼로그)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading || contentLoading || adding || isStreaming) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, contentLoading, adding, isStreaming]);

  // 5.9 네트워크 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOffline = () => {
      if (loading) {
        setLoading(false);
        setUploadError('NETWORK_ERROR');
      } else if (contentLoading || adding || isStreaming) {
        setContentLoading(false);
        setIsStreaming(false);
        setAdding(false);
        setDetailError('NETWORK_ERROR');
      }
    };

    const handleOnline = () => {
      // 온라인 복구 시 현재 상태 유지
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [loading, contentLoading, adding, isStreaming]);

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

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  // 분석 실행 파이프라인 (추출 데이터 기반 공통 실행)
  const runAnalysis = async (text: string, fileName: string) => {
    setLoading(true);
    setLoadingDelayed(false);
    setUploadError('none');

    try {
      const res = await fetchWithRetry<{ outlines: OutlineItem[] }>(
        '/api/ai/outline',
        { fullText: text, fileName },
        {
          timeoutMs: 35000,
          delayWarningMs: 3000,
          onDelayWarning: (delayed) => setLoadingDelayed(delayed),
          errorKeyFallback: 'AI_FAILED_OUTLINE',
          maxRetries: 1,
        }
      );

      if (!res.outlines || res.outlines.length === 0) {
        throw new AppApiError('NO_OUTLINE_FOUND');
      }

      setOutlines(res.outlines);
      setLoading(false);
      setLoadingDelayed(false);
      setView('outline');
    } catch (err: any) {
      console.error('Analysis error:', err);
      const key: ExceptionKey =
        err instanceof AppApiError
          ? err.errorKey
          : err.message in PRD_ERROR_MESSAGES
          ? (err.message as ExceptionKey)
          : 'AI_FAILED_OUTLINE';
      setUploadError(key);
      setLoading(false);
      setLoadingDelayed(false);
    }
  };

  // 일반 파일 업로드 분석
  const startAnalysis = async () => {
    if (!file) {
      setUploadError('EMPTY_FILE');
      return;
    }

    setLoading(true);
    setUploadError('none');

    try {
      const outcome = await extractTextFromPDF(file);
      if (!outcome.success) {
        setUploadError(outcome.errorKey);
        setLoading(false);
        setLoadingDelayed(false);
        return;
      }

      const extracted = outcome.data!;
      setPdfData(extracted);
      await runAnalysis(extracted.fullText, file.name);
    } catch (err: any) {
      setUploadError('CORRUPTED_PDF');
      setLoading(false);
      setLoadingDelayed(false);
    }
  };

  // 3종 샘플 강의자료 원클릭 선택 핸들러
  const handleSelectSample = (sample: SampleLecture) => {
    const fakeData: PDFExtractResult = {
      fileName: sample.fileName,
      fileSizeBytes: sample.fullText.length * 2,
      pageCount: sample.pageCount,
      totalCharacters: sample.fullText.length,
      pages: [{ pageNumber: 1, text: sample.fullText }],
      fullText: sample.fullText,
    };
    setPdfData(fakeData);
    setFile(new File([sample.fullText], sample.fileName, { type: 'application/pdf' }));
    runAnalysis(sample.fullText, sample.fileName);
  };

  // SSE 실시간 스트리밍 요약 로드 (Sprint 7 고도화)
  const loadSummaryForOutline = async (outline: OutlineItem) => {
    const existing = cache[outline.id]?.summary;
    if (existing && existing.length > 0) {
      setDetailError('none');
      setStreamingText('');
      setIsStreaming(false);
      return;
    }

    setContentLoading(true);
    setIsStreaming(true);
    setStreamingText('');
    setDetailError('none');

    try {
      const res = await fetch('/api/ai/summary-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentSlice: outline.contentSlice, title: outline.title }),
      });

      if (!res.ok || !res.body) {
        throw new Error('AI_FAILED_SUMMARY');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      setContentLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.fullText) {
                accumulated = parsed.fullText;
                setStreamingText(accumulated);
              } else if (parsed.bullet) {
                accumulated += (accumulated ? '\n' : '') + parsed.bullet;
                setStreamingText(accumulated);
              }
            } catch {
              // 파싱 무시
            }
          }
        }
      }

      const finalBullets = accumulated
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
        .filter(Boolean);

      if (finalBullets.length === 0) {
        throw new Error('AI_FAILED_SUMMARY');
      }

      setCache((prev) => ({
        ...prev,
        [outline.id]: {
          ...(prev[outline.id] || { quizzes: [], userAnswers: {} }),
          summary: finalBullets,
        },
      }));
      setIsStreaming(false);

      // 용어집 백그라운드 로드
      loadGlossaryForOutline(outline);
    } catch (err: any) {
      console.error('Summary stream error:', err);
      setIsStreaming(false);
      setContentLoading(false);
      const key: ExceptionKey =
        err.message in PRD_ERROR_MESSAGES ? (err.message as ExceptionKey) : 'AI_FAILED_SUMMARY';
      setDetailError(key);
    }
  };

  // 핵심 용어집 로드 (캐시 우선)
  const loadGlossaryForOutline = async (outline: OutlineItem) => {
    if (cache[outline.id]?.glossary && cache[outline.id]!.glossary!.length > 0) return;
    try {
      const res = await fetch('/api/ai/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentSlice: outline.contentSlice, title: outline.title }),
      });
      const data = await res.json();
      if (data.success && data.glossary) {
        setCache((prev) => ({
          ...prev,
          [outline.id]: {
            ...(prev[outline.id] || { quizzes: [], userAnswers: {} }),
            glossary: data.glossary,
          },
        }));
      }
    } catch {
      // 용어집 로드 실패는 치명적이지 않으므로 조용히 무시
    }
  };

  // 온디맨드 퀴즈 로드 (캐시 우선 & 공통 재시도 & 난이도 분기)
  const loadQuizForOutline = async (outline: OutlineItem, targetDifficulty: QuizDifficulty = difficulty) => {
    const isAdv = targetDifficulty === 'advanced';
    const existing = isAdv ? cache[outline.id]?.advancedQuizzes : cache[outline.id]?.quizzes;

    if (existing && existing.length > 0) {
      setDetailError('none');
      return;
    }

    setContentLoading(true);
    setDetailError('none');

    try {
      const res = await fetchWithRetry<{ quizzes: any[] }>(
        '/api/ai/quiz',
        {
          contentSlice: outline.contentSlice,
          title: outline.title,
          difficulty: targetDifficulty,
        },
        {
          timeoutMs: 25000,
          errorKeyFallback: 'AI_FAILED_QUIZ',
          maxRetries: 1,
        }
      );

      if (!res.quizzes || res.quizzes.length === 0) {
        throw new AppApiError('AI_FAILED_QUIZ');
      }

      setCache((prev) => {
        const topic = prev[outline.id] || { quizzes: [], userAnswers: {} };
        return {
          ...prev,
          [outline.id]: {
            ...topic,
            ...(isAdv
              ? { advancedQuizzes: res.quizzes, advancedAnswers: topic.advancedAnswers || {} }
              : { quizzes: res.quizzes, userAnswers: topic.userAnswers || {} }),
          },
        };
      });
      setContentLoading(false);
    } catch (err: any) {
      console.error('Quiz load error:', err);
      const key: ExceptionKey =
        err instanceof AppApiError
          ? err.errorKey
          : err.message in PRD_ERROR_MESSAGES
          ? (err.message as ExceptionKey)
          : 'AI_FAILED_QUIZ';
      setDetailError(key);
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'detail' && selectedOutline) {
      if (tab === 'summary') {
        loadSummaryForOutline(selectedOutline);
      } else if (tab === 'quiz') {
        loadQuizForOutline(selectedOutline, difficulty);
      }
    }
  }, [view, selectedOutline, tab, difficulty]);

  const answerQuiz = (qIndex: number, optionIndex: number) => {
    if (!selectedOutline) return;
    const isAdv = difficulty === 'advanced';

    setCache((prev) => {
      const currentTopic = prev[selectedOutline.id] || { quizzes: [], userAnswers: {} };
      if (isAdv) {
        const currentAnswers = currentTopic.advancedAnswers || {};
        if (currentAnswers[qIndex] !== undefined) return prev;
        return {
          ...prev,
          [selectedOutline.id]: {
            ...currentTopic,
            advancedAnswers: {
              ...currentAnswers,
              [qIndex]: optionIndex,
            },
          },
        };
      } else {
        const currentAnswers = currentTopic.userAnswers || {};
        if (currentAnswers[qIndex] !== undefined) return prev;
        return {
          ...prev,
          [selectedOutline.id]: {
            ...currentTopic,
            userAnswers: {
              ...currentAnswers,
              [qIndex]: optionIndex,
            },
          },
        };
      }
    });
  };

  // 문제 더 풀기 (5.8 중복 방지 및 기존 풀이 상태 100% 보존 머지 & 난이도 반영)
  const addMore = async () => {
    if (!selectedOutline) return;
    setAdding(true);
    setDetailError('none');

    const isAdv = difficulty === 'advanced';
    const currentQuizzes = isAdv
      ? cache[selectedOutline.id]?.advancedQuizzes || []
      : cache[selectedOutline.id]?.quizzes || [];
    const existingQuestions = currentQuizzes.map((q) => q.question);

    try {
      const res = await fetchWithRetry<{ quizzes: any[] }>(
        '/api/ai/quiz-more',
        {
          contentSlice: selectedOutline.contentSlice,
          title: selectedOutline.title,
          existingQuestions,
          difficulty,
        },
        {
          timeoutMs: 25000,
          errorKeyFallback: 'QUIZ_MORE_FAILED',
          maxRetries: 1,
        }
      );

      if (!res.quizzes || res.quizzes.length === 0) {
        throw new AppApiError('QUIZ_MORE_FAILED');
      }

      setCache((prev) => {
        const topic = prev[selectedOutline.id] || { quizzes: [], userAnswers: {} };
        return {
          ...prev,
          [selectedOutline.id]: {
            ...topic,
            ...(isAdv
              ? { advancedQuizzes: [...(topic.advancedQuizzes || []), ...res.quizzes] }
              : { quizzes: [...topic.quizzes, ...res.quizzes] }),
          },
        };
      });
      setAdding(false);
    } catch (err: any) {
      console.error('Quiz-more error:', err);
      const key: ExceptionKey =
        err instanceof AppApiError
          ? err.errorKey
          : err.message in PRD_ERROR_MESSAGES
          ? (err.message as ExceptionKey)
          : 'QUIZ_MORE_FAILED';
      setDetailError(key);
      setAdding(false);
    }
  };

  // 5.10 전체 세션 초기화 (새 PDF 업로드)
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

  const fileLabel = pdfData?.fileName ?? file?.name ?? '강의자료.pdf';
  const currentTopicCache = selectedOutline ? cache[selectedOutline.id] : undefined;
  const currentSummaries = currentTopicCache?.summary || [];
  const currentGlossary = currentTopicCache?.glossary || [];
  const currentQuizzes =
    difficulty === 'advanced'
      ? currentTopicCache?.advancedQuizzes || []
      : currentTopicCache?.quizzes || [];
  const currentAnswers =
    difficulty === 'advanced'
      ? currentTopicCache?.advancedAnswers || {}
      : currentTopicCache?.userAnswers || {};
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
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">강의자료 목차 요약·퀴즈</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={dark ? '라이트 모드' : '다크 모드'}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
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
            onSelectSample={handleSelectSample}
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
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            setView={setView}
            detailError={detailError}
            setDetailError={setDetailError}
            loading={contentLoading}
            streamingText={streamingText}
            isStreaming={isStreaming}
            summaries={currentSummaries}
            glossary={currentGlossary}
            quizzes={currentQuizzes}
            answers={currentAnswers}
            answer={answerQuiz}
            completed={completed}
            adding={adding}
            addMore={addMore}
            retry={() => {
              if (tab === 'summary') loadSummaryForOutline(selectedOutline);
              else if (detailError === 'QUIZ_MORE_FAILED') addMore();
              else loadQuizForOutline(selectedOutline, difficulty);
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
