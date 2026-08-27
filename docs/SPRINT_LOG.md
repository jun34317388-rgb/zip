# 스프린트 진행 로그 (Sprint Log)

> **프로젝트:** PDF 강의자료 목차·요약·퀴즈 뷰어  
> **기준 문서:** [PRD.md](file:///c:/zip/PRD.md), [DEVELOPMENT_PLAN.md](file:///c:/zip/docs/DEVELOPMENT_PLAN.md)  
> **최종 수정일:** 2026-08-27  

---

## 📊 스프린트 진행 현황 요약

| 스프린트 | 목표 | 상태 | 진행률 |
|---|---|:---:|:---:|
| **Sprint 1** | 기반 아키텍처 & PDF 파싱/유효성 검증 | 완료 (Done) | 100% |
| **Sprint 2** | LLM 파이프라인 & 목차 자동 구조화 | 완료 (Done) | 100% |
| **Sprint 3** | 목차별 요약 & 퀴즈 온디맨드 생성 및 캐싱 | 완료 (Done) | 100% |
| **Sprint 4** | 퀴즈 추가 생성 ("문제 더 풀기") & 중복 방지 | 완료 (Done) | 100% |
| **Sprint 5** | 10대 예외 처리 완비 & 복구 메커니즘 구축 | 완료 (Done) | 100% |
| **Sprint 6** | 실전 검증(PDF 3종) & DoD 최종 검수 | 완료 (Done) | 100% |

---

## 📝 스프린트별 상세 체크리스트

### [Sprint 1] 기반 아키텍처 및 PDF 파싱/유효성 검증
- [x] `lib/pdf/extractor.ts` 구현 (텍스트 및 메타데이터 추출, %PDF- 매직넘버 검증)
- [x] `lib/pdf/validator.ts` 구현 (5.1~5.4 사전/사후 검증)
  - [x] 5.1 빈 파일 / 0바이트 검증 (`EMPTY_FILE`)
  - [x] 5.2 MIME 타입 및 손상 파일 검증 (`INVALID_FILE_TYPE`, `CORRUPTED_PDF`)
  - [x] 5.3 20MB 및 과다 페이지(100p+) 제한 (`FILE_TOO_LARGE`)
  - [x] 5.4 스캔본/텍스트 미달 검증 (`NO_TEXT_EXTRACTED`)
- [x] `UploadView` UI 연동 및 실시간 파싱/에러 피드백 연결 (단위 테스트 14종 전수 통과)

### [Sprint 2] LLM 파이프라인 및 목차 자동 구조화
- [x] `/api/ai/outline` Next.js Route Handler 구현 (`app/api/ai/outline/route.ts`)
- [x] 목차 구조화 프롬프트 & Zod 스키마 검증 및 지능형 Fallback 파서 (`lib/ai/outline-service.ts`)
- [x] 5.5, 5.6, 5.7, 5.9 이상 결과 감지, 1회 자동 재시도 및 35s 타임아웃 / 지연 알림 로직
- [x] `OutlineView` 렌더링 및 각 목차별 `contentSlice` 원문 슬라이스 세션 격리 저장 (테스트 5종 전수 통과)

### [Sprint 3] 목차별 요약 & 퀴즈 온디맨드 생성 및 인메모리 캐싱
- [x] `/api/ai/summary` Route Handler 구현 (원문 기반 불릿 5~10개 고밀도 요약, 환각 방지)
- [x] `/api/ai/quiz` Route Handler 구현 (4지선다 2~3문항, 정답/해설, 요약 기반 풀이 난이도)
- [x] 전역 세션 인메모리 캐시(`cache[outlineId]`) 연동 (중복 LLM 호출 차단 & 즉시 전환)
- [x] `DetailView` 요약/퀴즈 탭 전환, 로딩 스켈레톤, 즉시 정답/오답 판정 및 해설 UI 연동 (테스트 9종 전수 통과)

### [Sprint 4] 퀴즈 추가 생성 ("문제 더 풀기") 및 중복 방지 시스템
- [x] 모든 문항 완료 감지 시 "문제 더 풀기" 버튼 활성화 로직
- [x] `/api/ai/quiz-more` 기존 출제 문항 동봉 및 신규 문항 생성 API 라우트
- [x] `lib/ai/dedup.ts` N-gram 자카드 유사도(0.70 기준) 중복 검사 및 5.8 1회 자동 백그라운드 재요청 파이프라인
- [x] 기존 문항 풀이 상태(선택 답안, 정답/오답 표시) 100% 보존하며 하단 머지 (테스트 8종 전수 통과)

### [Sprint 5] 10대 예외 처리 완비 및 복구 메커니즘
- [x] 5.1 ~ 5.10 전체 예외 케이스 규정 문구 및 화면 동작 전수 점검 (`lib/types.ts`, `lib/api/retry-client.ts`)
- [x] 공통 재시도 클라이언트 및 AbortController 타임아웃, 3초 경과 지연 안내 문구 전환
- [x] 5.9 네트워크 단절 (`online`/`offline` 이벤트 및 `NETWORK_ERROR`) 감지 및 화면 상태 100% 보존 복구
- [x] 5.10 새로고침 시 세션 초기화 및 분석 진행 중 브라우저 기본 이탈 확인 (`beforeunload`)
- [x] 컴포넌트 모듈화 (`UploadView`, `OutlineView`, `DetailView`, `ErrorBox`, `DevPanel`) 및 에러 UI 일원화
- [x] 자동화 테스트 스크립트(`scratch/test_sprint5_exceptions.mjs`) 및 빌드 검증 전수 통과

### [Sprint 6] 실전 검증 (PDF 3종), DoD 최종 검수 및 UI 폴리싱
- [x] 실제 강의자료 PDF 3종(운영체제, 데이터베이스, 소프트웨어 공학) 엔드투엔드 테스트 및 데이터셋 구축 (`lib/sample-data.ts`)
- [x] 업로드 화면 내 원클릭 "샘플 강의자료로 체험하기 (3종)" 퀵스타트 UI 연동 (`components/upload-view.tsx`)
- [x] PRD 제6장 Definition of Done 8개 항목 전수 검수 완료 (`scratch/test_sprint6_dod.mjs`, `docs/TEST_REPORT.md`)
- [x] 다크/라이트 모드 및 인터랙션 폴리싱 완료
