'use client';

import { BookOpen, ChevronRight, Clock, Hash, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OutlineItem, View } from '@/lib/types';

interface OutlineViewProps {
  fileLabel: string;
  pageCount?: number;
  charCount?: number;
  outlines: OutlineItem[];
  setView: (v: View) => void;
  onReset: () => void;
  onSelect: (item: OutlineItem) => void;
}

export function OutlineView({
  fileLabel,
  pageCount,
  charCount,
  outlines,
  onReset,
  onSelect,
}: OutlineViewProps) {
  return (
    <section className="mx-auto w-full max-w-2xl animate-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2.5">
            <Sparkles className="size-3" />
            <span>구조화 분석 완료</span>
          </div>
          <h1 className="truncate text-xl font-bold sm:text-2xl text-foreground" title={fileLabel}>
            {fileLabel}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            {pageCount ? <span>총 {pageCount}페이지 ({charCount?.toLocaleString()}자)</span> : null}
            <span>•</span>
            <span>핵심 목차 <strong className="text-foreground">{outlines.length}개</strong> 챕터</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 h-9 gap-1.5 text-xs font-semibold" onClick={onReset}>
          <Upload className="size-3.5" />
          새 파일 분석
        </Button>
      </div>

      <div className="flex flex-col gap-3.5">
        {outlines.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 sm:p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative overflow-hidden"
          >
            {/* 상단 메타 라인: 챕터 번호 뱃지 & 페이지 범위 & 예상 학습 시간 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold shadow-xs">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Chapter {index + 1}
                </span>
                {item.pageRange && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <BookOpen className="size-3" />
                    <span>{item.pageRange}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock className="size-3 text-muted-foreground" />
                <span>약 {item.estimatedMinutes || 5}분 학습</span>
              </div>
            </div>

            {/* 본문 타이틀 (줄바꿈 완벽 지원, 잘림 방지) & 화살표 */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-bold sm:text-base text-foreground leading-snug break-keep whitespace-normal group-hover:text-primary transition-colors flex-1">
                {item.title}
              </h3>
              <div className="size-7 rounded-full bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all mt-0.5">
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* 하단 토픽 태그 칩 리스트 */}
            {item.topicTags && item.topicTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50">
                {item.topicTags.map((tag, tagIdx) => (
                  <span
                    key={tagIdx}
                    className="inline-flex items-center gap-0.5 rounded-md bg-muted/70 hover:bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors"
                  >
                    <Hash className="size-2.5 text-primary/70" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
