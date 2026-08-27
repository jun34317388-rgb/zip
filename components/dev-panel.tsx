'use client';

import { ExceptionKey, PRD_ERROR_MESSAGES, View } from '@/lib/types';

interface DevPanelProps {
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
}

export function DevPanel({
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
}: DevPanelProps) {
  return (
    <aside className="fixed bottom-4 right-4 z-20 w-84 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <button
        className="flex w-full items-center justify-between font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>🛠️ 10대 예외 & 상태 테스트 패널</span>
        <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded">{open ? '접기' : '열기'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          <label className="flex items-center justify-between gap-3 font-medium">
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
          <label className="flex items-center justify-between gap-3 font-medium">
            로딩 인디케이터
            <input
              type="checkbox"
              checked={loading}
              onChange={(e) => setLoading(e.target.checked)}
              className="size-4 rounded"
            />
          </label>
          <label className="flex flex-col gap-1 font-medium">
            업로드 화면(뷰 A) 예외 시뮬레이션
            <select
              value={uploadError}
              onChange={(e) => setUploadError(e.target.value as ExceptionKey)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="none">정상 (오류 없음)</option>
              <option value="EMPTY_FILE">5.1 빈 파일 / 미선택</option>
              <option value="INVALID_FILE_TYPE">5.2 확장자/MIME 불일치</option>
              <option value="CORRUPTED_PDF">5.2 손상된 파일</option>
              <option value="FILE_TOO_LARGE">5.3 용량/페이지 초과</option>
              <option value="NO_TEXT_EXTRACTED">5.4 스캔본/텍스트 없음</option>
              <option value="AI_FAILED_OUTLINE">5.5 목차 분석 실패</option>
              <option value="AI_TIMEOUT">5.6 타임아웃</option>
              <option value="AI_INVALID_FORMAT">5.7 응답 형식 이상</option>
              <option value="NO_OUTLINE_FOUND">5.7 목차 미인식</option>
              <option value="NETWORK_ERROR">5.9 네트워크 단절</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 font-medium">
            상세 화면(뷰 C) 예외 시뮬레이션
            <select
              value={detailError}
              onChange={(e) => setDetailError(e.target.value as ExceptionKey)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="none">정상 (오류 없음)</option>
              <option value="AI_FAILED_SUMMARY">5.5 요약 생성 실패</option>
              <option value="AI_FAILED_QUIZ">5.5 퀴즈 생성 실패</option>
              <option value="QUIZ_MORE_FAILED">5.8 추가 문제 생성 실패</option>
              <option value="AI_TIMEOUT">5.6 타임아웃</option>
              <option value="AI_INVALID_FORMAT">5.7 형식 오류</option>
              <option value="NETWORK_ERROR">5.9 네트워크 단절</option>
            </select>
          </label>
          <div className="rounded-lg bg-muted p-2.5 text-[11px] leading-relaxed text-muted-foreground border border-border/60">
            <strong className="text-foreground">📌 적용 중인 PRD 규정 문구:</strong>
            <p className="mt-1 font-medium text-destructive">{simulatedError}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
