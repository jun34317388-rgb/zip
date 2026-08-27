'use client';

import { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { BookOpen, FileText, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBox } from '@/components/error-box';
import { ExceptionKey } from '@/lib/types';
import { SAMPLE_LECTURES, SampleLecture } from '@/lib/sample-data';

interface UploadViewProps {
  file: File | null;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  chooseFile: (f?: File) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  loading: boolean;
  loadingDelayed: boolean;
  startAnalysis: () => void;
  onSelectSample: (sample: SampleLecture) => void;
  error: ExceptionKey;
  clearFile: () => void;
  retry: () => void;
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadView({
  file,
  dragging,
  setDragging,
  chooseFile,
  onDrop,
  loading,
  loadingDelayed,
  startAnalysis,
  onSelectSample,
  error,
  clearFile,
  retry,
}: UploadViewProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center animate-in">
      <div className="mb-8 max-w-lg">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary">학습 자료를 스마트하게 정리해보세요</p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          강의자료에서 핵심만<br className="hidden sm:block" /> 빠르게 찾아보세요
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">PDF를 올리면 목차별 요약과 퀴즈를 자동으로 만들어드려요.</p>
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
        className={`w-full cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all sm:p-10 ${
          dragging
            ? 'border-primary bg-primary/5 shadow-sm scale-[1.01]'
            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {file ? (
          <div className="mx-auto flex max-w-md items-center gap-4 rounded-lg border border-border bg-background p-4 text-left shadow-xs">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              aria-label="선택한 파일 삭제"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ) : (
          <>
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <Upload className="size-6" />
            </span>
            <p className="font-semibold text-foreground">PDF 파일을 여기에 끌어다 놓으세요</p>
            <p className="mt-1.5 text-xs text-muted-foreground">또는 클릭해서 파일 선택</p>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        텍스트가 포함된 PDF만 지원해요 · 최대 20MB · 20~40페이지 권장
      </p>

      {error !== 'none' && (
        <div className="mt-6 w-full">
          <ErrorBox errorKey={error} retry={retry} />
        </div>
      )}

      <Button
        size="lg"
        className="mt-6 w-full max-w-md h-12 text-base font-semibold shadow-xs rounded-lg active:scale-[0.98] transition-all"
        disabled={loading || !file}
        onClick={startAnalysis}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            목차를 분석하고 있습니다...
          </>
        ) : (
          '업로드 및 분석 시작'
        )}
      </Button>

      {loading && loadingDelayed && (
        <p className="mt-3 text-sm font-medium text-muted-foreground animate-in fade-in">
          분석에 시간이 걸리고 있어요. 잠시만 기다려주세요.
        </p>
      )}

      {/* 3종 샘플 강의자료 퀵스타트 섹션 */}
      <div className="mt-10 w-full rounded-lg border border-border/80 bg-card/70 p-5 text-left backdrop-blur sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">
            실제 강의자료 샘플로 바로 체험해보세요
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {SAMPLE_LECTURES.map((sample) => (
            <button
              key={sample.id}
              disabled={loading}
              onClick={() => onSelectSample(sample)}
              className="group flex flex-col justify-between rounded-lg border border-border bg-background/90 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <div>
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary mb-2">
                  {sample.badge}
                </span>
                <h3 className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {sample.title}
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <BookOpen className="size-3" />
                <span>체험하기 ({sample.pageCount}p)</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
