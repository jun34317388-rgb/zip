'use client';

import React, { useRef } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers,
  LockOpen,
  Printer,
  Sparkles,
  Timer,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SAMPLE_LECTURES, SampleLecture } from '@/lib/sample-data';

interface LandingViewProps {
  onGetStarted: () => void;
  onSelectSample: (sample: SampleLecture) => void;
  onFileDrop: (file: File) => void;
}

export function LandingView({
  onGetStarted,
  onSelectSample,
  onFileDrop,
}: LandingViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileDrop(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileDrop(selectedFile);
    }
  };

  return (
    <div className="flex flex-col w-full animate-in">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-border/60">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
              <Sparkles className="size-3.5" />
              <span>Academic Intelligence System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.18] mb-6">
              PDF 강의자료를<br />
              <span className="text-primary">스마트한 학습 가이드</span>로
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              강의 슬라이드나 교재 PDF를 업로드하세요. AI가 목차를 지능적으로 구조화하고, 
              실시간 불릿 요약과 난이도별 퀴즈를 생성하여 깊이 있는 학습을 지원합니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2 transition-transform active:scale-[0.98]"
              >
                <span>지금 무료로 시작하기</span>
                <ArrowRight className="size-4" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium py-2">
                <Zap className="size-4 text-amber-500 fill-amber-500" />
                <span>회원가입 · 로그인 불필요</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-border bg-card p-6 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-destructive/80" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Academia AI Studio</span>
            </div>

            <div className="flex flex-col gap-3 my-auto">
              <div className="p-3.5 rounded-xl bg-muted/70 border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                  <FileText className="size-3.5" />
                  <span>Chapter 1. 운영체제 개요 및 프로세스 관리</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  • 프로세스는 메모리에 적재되어 실행 중인 인스턴스 (Code, Data, Heap, Stack)...
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                  <span>🎯 이해도 확인 퀴즈 (심화 응용)</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">100% 정답</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Q. 문맥 교환(Context Switch) 발생 시 PCB 상태 변화 원리는?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" /> 원문 100% 기반 환각 차단
              </span>
              <span className="font-semibold text-primary">0.5s 실시간 스트리밍</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Feature / How It Works 3-Step Bento Grid */}
      <section className="py-16 sm:py-20 max-w-4xl mx-auto w-full border-b border-border/60">
        <div className="text-center mb-12 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            어떻게 작동하나요?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            방해 요소 없이 오직 학습과 이해에만 집중할 수 있는 3단계 워크플로우입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-start transition-all hover:border-primary/50 hover:shadow-md">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary">
              <Upload className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">1. 간편한 업로드</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              수업 슬라이드나 전공 교재 PDF 파일을 끌어다 놓으세요. 텍스트 레이어를 1분 이내에 안전하게 추출합니다.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-start transition-all hover:border-primary/50 hover:shadow-md">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary">
              <Layers className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">2. 목차 & 요약 구조화</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Gemini 3.6 Flash가 챕터별로 목차를 나누고, 0.5초 만에 핵심 불릿 요약과 필수 전공 용어 사전을 작성합니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-start transition-all hover:border-primary/50 hover:shadow-md">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary">
              <GraduationCap className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">3. 난이도별 퀴즈 & 복습</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              기초 확인부터 심화 응용까지 퀴즈를 풀고, 틀린 문항은 AI가 원문 기반 오답 분석과 맞춤 복습 힌트를 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Value Proposition Section */}
      <section className="py-16 sm:py-20 max-w-4xl mx-auto w-full border-b border-border/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-3">왜 Academia AI인가요?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                방대한 강의자료를 일일이 형광펜 칠하며 정리하던 시간을 획기적으로 줄이고 학습의 본질에 집중하세요.
              </p>
              <div className="p-4 rounded-xl bg-muted/60 border border-border/80 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">대학 및 전공 강의 특화</p>
                  <p className="text-[11px] text-muted-foreground">컴퓨터공학, 경영, 법학, 자연과학 등 복잡한 학술 구조 완벽 지원</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Timer className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">학습 시간 90% 단축</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  수십 페이지 분량의 자료에서 핵심 개념과 구조만 1초 만에 파악할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Printer className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">학습 몰입 인터페이스</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  눈이 편안한 Soft Lavender 톤과 단정한 타이포그래피로 장시간 학습 피로를 줄입니다.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <LockOpen className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">완전 무료 & 무가입</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  로그인이나 개인정보 입력 없이 브라우저에서 즉시 모든 기능을 무료로 이용할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <GraduationCap className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">학술적 엄밀성</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  원문에 없는 내용을 절대 지어내지 않으며, 모든 퀴즈에 원문 근거 해설이 포함됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Quick-Start Dropzone & Sample Chips */}
      <section className="py-16 sm:py-20 max-w-3xl mx-auto w-full text-center">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-sm flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            지금 바로 학습을 시작해보세요
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md">
            PDF 파일을 아래에 끌어다 놓거나, 준비된 샘플 자료로 AI 분석을 1초 만에 체험해보세요.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-md border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 bg-muted/40 hover:bg-muted/70 transition-all cursor-pointer flex flex-col items-center justify-center mb-6 group"
          >
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">PDF 파일을 여기에 끌어다 놓으세요</p>
            <p className="text-xs text-muted-foreground">또는 클릭하여 파일 탐색기 열기</p>
          </div>

          <Button
            onClick={onGetStarted}
            size="lg"
            className="h-11 px-8 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            PDF 직접 업로드하기
          </Button>

          {/* 3종 실전 샘플 퀵스타트 칩 */}
          <div className="mt-10 w-full pt-6 border-t border-border/80 text-left">
            <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>실전 전공 샘플로 바로 체험하기:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_LECTURES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 group"
                >
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {sample.badge}
                  </span>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1 mt-1.5 group-hover:text-primary transition-colors">
                    {sample.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{sample.pageCount}페이지 분량</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-12 py-8 border-t border-border text-center text-xs text-muted-foreground">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Academia AI</span>
            <span>· Academic Intelligence System</span>
          </div>
          <p>© 2026 Academia AI. Structured learning for the digital age.</p>
        </div>
      </footer>
    </div>
  );
}
