'use client';

import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  ListTree,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SAMPLE_LECTURES, SampleLecture } from '@/lib/sample-data';

interface LandingViewProps {
  onStart: () => void;
  onSelectSample: (sample: SampleLecture) => void;
}

export function LandingView({ onStart, onSelectSample }: LandingViewProps) {
  return (
    <div className="flex flex-col gap-20 sm:gap-28 pb-16 animate-in">
      {/* 1. Hero Section */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6 shadow-xs">
          <Sparkles className="size-3.5" />
          <span>Academic Intelligence System · Scholarly Ambient</span>
        </div>

        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] text-foreground leading-[1.2]">
          수백 페이지 전공 강의자료,<br />
          <span className="text-primary">목차별 핵심 요약과 퀴즈</span>로 완성하세요
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg leading-relaxed">
          PDF를 올리면 AI가 목차를 자동 분석하고, <strong>0.5초 실시간 스트리밍 요약</strong>,{' '}
          <strong>기초/심화 퀴즈</strong>, 그리고 <strong>1:1 맞춤 오답 튜터링</strong>까지 즉시 제공합니다.
        </p>

        {/* CTA 버튼 그룹 */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center">
          <Button
            size="lg"
            onClick={onStart}
            className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-[0.98] gap-2 rounded-lg"
          >
            <span>지금 바로 분석 시작하기</span>
            <ArrowRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onSelectSample(SAMPLE_LECTURES[0])}
            className="w-full sm:w-auto h-12 px-6 text-sm font-semibold border-border bg-card hover:bg-accent/40 text-foreground shadow-xs transition-all active:scale-[0.98] gap-2 rounded-lg"
          >
            <BookOpen className="size-4 text-primary" />
            <span>샘플 자료로 1초 체험</span>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-primary" />
            <span>환각 없는 100% 원문 기반</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-primary" />
            <span>Gemini 3.6 Flash 실시간 파이프라인</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-primary" />
            <span>회원가입 없이 즉시 사용</span>
          </div>
        </div>
      </section>

      {/* 2. 핵심 기능 4대 카드 (Feature Grid) */}
      <section className="mx-auto w-full max-w-4xl">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Key Capabilities</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            학습 몰입도를 극대화하는 4대 AI 학습 엔진
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            단순 요약을 넘어 목차 구조화부터 실전 퀴즈 피드백까지 완결된 학습 흐름을 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Card 1 */}
          <article className="group rounded-lg border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListTree className="size-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors">
              1분 만의 목차 자동 구조화
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              뒤죽박죽 긴 PDF 문서를 챕터·섹션 단위로 자동 분할하고 원문 범위를 격리하여, 원하는 단원만 콕 집어 학습할 수 있습니다.
            </p>
          </article>

          {/* Card 2 */}
          <article className="group rounded-lg border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="size-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors">
              0.5초 실시간 SSE 고밀도 요약
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              대기 시간 없이 즉각 첫 문장부터 타이핑되는 스트리밍 요약으로, 사족 없이 핵심 개념 5~10개 불릿을 고밀도로 압축합니다.
            </p>
          </article>

          {/* Card 3 */}
          <article className="group rounded-lg border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Brain className="size-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors">
              적응형 퀴즈 & AI 맞춤 오답노트
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              기초 개념 확인형부터 실전 심화 응용형까지 난이도를 선택할 수 있으며, 오답 선택 시 AI가 왜 틀렸는지 원인과 복습 포인트를 분석합니다.
            </p>
          </article>

          {/* Card 4 */}
          <article className="group rounded-lg border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors">
              핵심 전공 용어 사전 (Glossary)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              각 목차마다 반드시 암기해야 할 전공 용어 3~5개와 명확한 정의를 자동 추출하여 체계적인 어휘 정리를 돕습니다.
            </p>
          </article>
        </div>
      </section>

      {/* 3. How It Works (3단계 사용 흐름) */}
      <section className="mx-auto w-full max-w-4xl rounded-lg border border-border bg-muted/40 p-7 sm:p-10">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Simple Workflow</p>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">단 3단계로 시작하는 스마트 학습</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-border/80">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs mb-3">
              1
            </span>
            <h4 className="text-sm font-bold text-foreground mb-1">PDF 업로드</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              공부할 강의자료나 전공 서적 PDF를 드래그하여 올립니다.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-border/80">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs mb-3">
              2
            </span>
            <h4 className="text-sm font-bold text-foreground mb-1">목차 선택 & 요약</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              구조화된 목차 카드를 클릭하여 실시간 핵심 요약을 정독합니다.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-border/80">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs mb-3">
              3
            </span>
            <h4 className="text-sm font-bold text-foreground mb-1">퀴즈 & 오답 복습</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              4지선다 퀴즈를 풀고 AI 오답 가이드로 완벽하게 이해를 다집니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 실전 샘플 3종 퀵스타트 섹션 */}
      <section className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">준비된 파일이 없으신가요?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              실제 컴퓨터공학·데이터·소프트웨어 전공 강의자료로 즉시 체험해보세요.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SAMPLE_LECTURES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSample(sample)}
              className="group flex flex-col justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div>
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary mb-2.5">
                  {idx === 0 ? '컴퓨터공학' : idx === 1 ? '데이터 엔지니어링' : '소프트웨어 설계'}
                </span>
                <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {sample.fileName.replace('.pdf', '')}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {sample.fullText.slice(0, 70)}...
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-primary pt-3 border-t border-border/60">
                <span>{sample.pageCount}페이지 분석</span>
                <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  체험하기 &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Bottom Banner CTA */}
      <section className="mx-auto w-full max-w-4xl rounded-lg border border-primary/20 bg-primary p-8 sm:p-12 text-center text-primary-foreground shadow-md">
        <h3 className="text-2xl font-bold sm:text-3xl text-white">
          지금 바로 강의자료를 올려보세요
        </h3>
        <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-primary-foreground/90 leading-relaxed">
          복잡한 시험 범위도 1분이면 목차별로 깔끔하게 정리됩니다.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={onStart}
            className="h-12 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-sm transition-all active:scale-[0.98] gap-2 rounded-lg"
          >
            <FileText className="size-4 text-primary" />
            <span>PDF 업로드 화면으로 이동</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
