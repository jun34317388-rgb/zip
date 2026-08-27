'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExceptionKey, PRD_ERROR_MESSAGES } from '@/lib/types';

interface ErrorBoxProps {
  errorKey?: ExceptionKey;
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorBox({ errorKey, message, retry, className = '' }: ErrorBoxProps) {
  const displayMessage =
    message || (errorKey && errorKey !== 'none' ? PRD_ERROR_MESSAGES[errorKey] : '');

  if (!displayMessage) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start sm:items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive ${className}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <AlertCircle className="mt-0.5 sm:mt-0 size-5 shrink-0" />
        <span className="leading-6 font-medium">{displayMessage}</span>
      </div>
      {retry && (
        <Button
          variant="outline"
          size="sm"
          onClick={retry}
          className="shrink-0 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-destructive font-medium h-8"
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          다시 시도
        </Button>
      )}
    </div>
  );
}
