'use client';

import { ChevronRight, Upload } from 'lucide-react';
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">분석이 완료되었어요</p>
          <h1 className="truncate text-xl font-bold sm:text-2xl text-foreground" title={fileLabel}>
            {fileLabel}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {pageCount ? `${pageCount}페이지 (${charCount?.toLocaleString()}자) · ` : ''}
            목차 <span className="font-semibold text-foreground">{outlines.length}개</span>를 찾았어요
          </p>
        </div>
        <Button variant="outline" className="shrink-0 h-10 gap-2" onClick={onReset}>
          <Upload className="size-4" />
          새 PDF 업로드
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {outlines.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex items-center gap-4 sm:gap-5 rounded-lg border border-border bg-card px-5 py-4 sm:py-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted font-mono text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 text-sm font-medium sm:text-base text-card-foreground line-clamp-2">
              {item.title}
            </span>
            <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </section>
  );
}
