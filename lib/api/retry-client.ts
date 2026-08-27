import { ExceptionKey } from '@/lib/types';

export interface RetryClientOptions {
  timeoutMs?: number;
  delayWarningMs?: number;
  onDelayWarning?: (delayed: boolean) => void;
  errorKeyFallback?: ExceptionKey;
  maxRetries?: number;
}

export class AppApiError extends Error {
  public errorKey: ExceptionKey;

  constructor(errorKey: ExceptionKey, message?: string) {
    super(message || errorKey);
    this.name = 'AppApiError';
    this.errorKey = errorKey;
  }
}

/**
 * AI 엔드포인트 공통 fetch 래퍼
 * - 5.5: API 실패 시 최대 1회 자동 재시도 후 에러 throw
 * - 5.6: 타임아웃 (AbortController) 초과 시 AI_TIMEOUT, 3초 경과 시 지연 알림 콜백
 * - 5.9: 네트워크 단절 시 NETWORK_ERROR
 */
export async function fetchWithRetry<T = any>(
  url: string,
  body: Record<string, any>,
  options: RetryClientOptions = {},
  attempt = 1
): Promise<T> {
  const {
    timeoutMs = 30000,
    delayWarningMs = 3000,
    onDelayWarning,
    errorKeyFallback = 'AI_FAILED_OUTLINE',
    maxRetries = 1,
  } = options;

  // 5.9 브라우저 네트워크 단절 사전 체크
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new AppApiError('NETWORK_ERROR', 'Network is offline');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let delayTimer: NodeJS.Timeout | null = null;
  if (onDelayWarning && delayWarningMs > 0) {
    delayTimer = setTimeout(() => {
      onDelayWarning(true);
    }, delayWarningMs);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (delayTimer) clearTimeout(delayTimer);
    if (onDelayWarning) onDelayWarning(false);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const serverKey = (errData?.errorKey as ExceptionKey) || errorKeyFallback;

      // 5.5 1회 자동 재시도 (5xx 서버 오류 등)
      if (attempt <= maxRetries && (res.status >= 500 || res.status === 429)) {
        return await fetchWithRetry<T>(url, body, options, attempt + 1);
      }

      throw new AppApiError(serverKey);
    }

    const data = await res.json();
    if (!data.success) {
      const serverKey = (data?.errorKey as ExceptionKey) || errorKeyFallback;
      if (attempt <= maxRetries) {
        return await fetchWithRetry<T>(url, body, options, attempt + 1);
      }
      throw new AppApiError(serverKey);
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (delayTimer) clearTimeout(delayTimer);
    if (onDelayWarning) onDelayWarning(false);

    if (err instanceof AppApiError) {
      throw err;
    }

    // 5.6 타임아웃
    if (err.name === 'AbortError') {
      throw new AppApiError('AI_TIMEOUT', 'Request timed out');
    }

    // 5.9 네트워크 단절 / fetch 실패
    if (
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('network')
    ) {
      throw new AppApiError('NETWORK_ERROR', 'Network connection error');
    }

    // 기타 네트워크/파싱 오류 시 1회 자동 재시도
    if (attempt <= maxRetries) {
      return await fetchWithRetry<T>(url, body, options, attempt + 1);
    }

    throw new AppApiError(errorKeyFallback, err.message);
  }
}
