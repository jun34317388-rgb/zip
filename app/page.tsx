'use client'

import { ChangeEvent, DragEvent, KeyboardEvent, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type View = 'upload' | 'outline' | 'detail'
type UploadError = 'none' | 'select' | 'type' | 'open' | 'size' | 'text' | 'analysis' | 'outline' | 'timeout' | 'network'
type DetailError = 'none' | 'summary' | 'quiz' | 'more'
type Quiz = { question: string; options: string[]; answer: number; explanation: string }

const errors: Record<Exclude<UploadError, 'none'>, string> = {
  select: '업로드할 PDF 파일을 먼저 선택해주세요.',
  type: 'PDF 파일만 업로드할 수 있어요. 파일 형식을 확인해주세요.',
  open: 'PDF 파일을 열 수 없어요. 파일이 손상되지 않았는지 확인해주세요.',
  size: '파일 용량이 너무 커서 처리할 수 없어요. 더 작은 파일이나 일부 페이지만 포함된 PDF로 다시 시도해주세요.',
  text: '이 PDF에서는 텍스트를 추출할 수 없어요. 스캔된 이미지 PDF는 지원하지 않으며, 텍스트가 포함된 PDF만 처리할 수 있어요.',
  analysis: '목차를 분석하는 중 문제가 발생했어요. 다시 시도해주세요.',
  outline: '이 강의자료의 목차를 인식하지 못했어요. 다른 파일로 시도해보시거나 다시 시도해주세요.',
  timeout: '응답이 너무 오래 걸려 처리를 중단했어요. 다시 시도해주세요.',
  network: '네트워크 연결을 확인해주세요. 연결이 끊어져 요청을 완료하지 못했어요.',
}

const topics = [
  '데이터베이스 시스템 개요', '관계형 데이터 모델', 'SQL 기초 문법', '관계 대수와 질의 처리',
  '데이터베이스 설계와 정규화', '트랜잭션과 동시성 제어', '회복 시스템과 장애 처리', '인덱스와 질의 최적화',
]
const summaries = [
  '데이터베이스는 여러 사용자가 공유하는 구조화된 데이터를 효율적으로 저장하고 검색하기 위한 시스템이다. 파일 시스템의 중복성과 일관성 문제를 해결하며, 데이터와 이를 관리하는 소프트웨어를 함께 포함한다.',
  'DBMS는 데이터 정의, 조작, 제어 기능을 제공하고 응용 프로그램과 저장 장치 사이에서 추상화 계층 역할을 한다. 사용자는 물리적 저장 방식 대신 논리적인 질의에 집중할 수 있다.',
  '데이터 독립성은 스키마 변경이 상위 단계에 미치는 영향을 줄이는 핵심 개념이다. 외부, 개념, 내부 스키마의 3단계 구조를 통해 논리적·물리적 독립성을 확보한다.',
  '관계형 데이터베이스는 릴레이션이라는 표 형태로 데이터를 표현한다. 각 행은 튜플, 열은 애트리뷰트이며, 기본키는 튜플을 유일하게 식별한다.',
  '무결성 제약조건은 데이터가 정확하고 일관되게 유지되도록 보장한다. 개체 무결성은 기본키의 유일성과 NOT NULL을, 참조 무결성은 외래키 관계의 유효성을 다룬다.',
  '데이터베이스 설계에서는 업무 요구사항을 분석하고 개념적 모델을 만든 뒤 논리적·물리적 모델로 변환한다. 좋은 설계는 중복을 줄이면서도 질의 성능과 관리 편의성을 균형 있게 고려한다.',
  '트랜잭션은 하나의 논리적 작업 단위로, 전부 성공하거나 전부 반영되지 않아야 한다. 원자성, 일관성, 고립성, 지속성의 ACID 특성이 안정적인 데이터 처리를 뒷받침한다.',
]
const quizzes: Quiz[] = [
  { question: 'DBMS가 사용자에게 제공하는 가장 중요한 추상화는 무엇인가요?', options: ['물리적 디스크의 종류', '데이터 저장 구조의 세부 사항', '운영체제의 프로세스 목록', '네트워크 패킷의 경로'], answer: 1, explanation: 'DBMS는 저장 구조의 복잡성을 숨기고 논리적인 데이터 조작에 집중할 수 있게 합니다.' },
  { question: '다음 중 데이터베이스의 3단계 스키마 구조에 포함되지 않는 것은 무엇인가요?', options: ['외부 스키마', '개념 스키마', '내부 스키마', '실행 스키마'], answer: 3, explanation: '3단계 스키마는 외부, 개념, 내부 스키마로 구성됩니다.' },
  { question: '관계형 모델에서 튜플을 유일하게 식별하는 속성은 무엇인가요?', options: ['외래키', '기본키', '후보 값', '도메인'], answer: 1, explanation: '기본키는 릴레이션 내 각 튜플을 유일하게 식별하며 NULL을 허용하지 않습니다.' },
  { question: 'ACID 특성 중 트랜잭션 결과가 장애 이후에도 보존됨을 의미하는 것은?', options: ['원자성', '일관성', '고립성', '지속성'], answer: 3, explanation: '지속성은 성공적으로 완료된 트랜잭션의 결과가 시스템 장애 후에도 보존되는 특성입니다.' },
  { question: '참조 무결성이 보장하는 것은 무엇인가요?', options: ['모든 열의 이름이 같은 것', '외래키가 유효한 대상을 가리키는 것', '인덱스가 항상 존재하는 것', '모든 값이 숫자인 것'], answer: 1, explanation: '외래키는 참조하는 릴레이션의 기본키 또는 후보키 값과 일치해야 합니다.' },
  { question: '질의 성능을 높이기 위해 검색 키를 별도로 관리하는 구조는?', options: ['인덱스', '뷰', '트리거', '커서'], answer: 0, explanation: '인덱스는 특정 열의 값을 빠르게 찾을 수 있도록 검색 구조를 제공합니다.' },
]

function formatSize(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MB` }

export default function Page() {
  const [view, setView] = useState<View>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState<UploadError>('none')
  const [detailError, setDetailError] = useState<DetailError>('none')
  const [dark, setDark] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(0)
  const [tab, setTab] = useState<'summary' | 'quiz'>('summary')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizItems, setQuizItems] = useState(quizzes.slice(0, 4))
  const [adding, setAdding] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const completed = Object.keys(answers).length
  const chooseFile = (next: File | undefined) => {
    if (!next) return
    if (next.type !== 'application/pdf') return setUploadError('type')
    if (next.size > 20 * 1024 * 1024) return setUploadError('size')
    setUploadError('none'); setFile(next)
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]) }
  const startAnalysis = () => { if (!file) return setUploadError('select'); setLoading(true); setTimeout(() => { setLoading(false); setView('outline') }, 900) }
  const addMore = () => { setAdding(true); setTimeout(() => { setQuizItems(quizzes); setAdding(false); setDetailError('none') }, 800) }
  const answer = (q: number, option: number) => { if (answers[q] === undefined) setAnswers((current) => ({ ...current, [q]: option })) }
  const fileLabel = file?.name ?? '데이터베이스개론_3주차.pdf'
  const simulatedError = view === 'upload' ? uploadError : detailError

  return (
    <div className={dark ? 'dark min-h-screen' : 'min-h-screen'}>
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <button onClick={() => setView('upload')} className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText aria-hidden="true" /></span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">강의자료 목차 요약·퀴즈</span>
          </button>
          <Button variant="ghost" size="icon" aria-label={dark ? '라이트 모드' : '다크 모드'} onClick={() => setDark(!dark)}>{dark ? <Sun data-icon="inline-start" /> : <Moon data-icon="inline-start" />}</Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col px-5 py-10 sm:py-16">
        {view === 'upload' && <UploadView file={file} dragging={dragging} setDragging={setDragging} chooseFile={chooseFile} onDrop={onDrop} loading={loading} startAnalysis={startAnalysis} error={uploadError} clearFile={() => setFile(null)} retry={() => setUploadError('none')} />}
        {view === 'outline' && <OutlineView fileLabel={fileLabel} setView={setView} onSelect={(index) => { setSelectedTopic(index); setView('detail') }} />}
        {view === 'detail' && <DetailView title={topics[selectedTopic]} tab={tab} setTab={setTab} setView={setView} detailError={detailError} setDetailError={setDetailError} summaryLoading={loading} quizzes={quizItems} answers={answers} answer={answer} completed={completed} adding={adding} addMore={addMore} />}
      </main>

      <DevPanel open={panelOpen} setOpen={setPanelOpen} view={view} setView={setView} loading={loading} setLoading={setLoading} uploadError={uploadError} setUploadError={setUploadError} detailError={detailError} setDetailError={setDetailError} simulatedError={simulatedError} />
    </div>
  )
}

function UploadView({ file, dragging, setDragging, chooseFile, onDrop, loading, startAnalysis, error, clearFile, retry }: { file: File | null; dragging: boolean; setDragging: (v: boolean) => void; chooseFile: (f?: File) => void; onDrop: (e: DragEvent<HTMLDivElement>) => void; loading: boolean; startAnalysis: () => void; error: UploadError; clearFile: () => void; retry: () => void }) {
  return <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center animate-in">
    <div className="mb-10 max-w-lg"><p className="mb-3 text-sm font-medium text-primary">학습 자료를 정리해보세요</p><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">강의자료에서 핵심만<br className="hidden sm:block" /> 빠르게 찾아보세요</h1><p className="mt-4 leading-7 text-muted-foreground">PDF를 올리면 목차별 요약과 퀴즈를 만들어드려요.</p></div>
    <input id="pdf-input" className="sr-only" type="file" accept="application/pdf" onChange={(e: ChangeEvent<HTMLInputElement>) => chooseFile(e.target.files?.[0])} />
    <div role="button" tabIndex={0} aria-label="PDF 파일 업로드 영역" onClick={() => document.getElementById('pdf-input')?.click()} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('pdf-input')?.click() }} onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`w-full rounded-2xl border-2 border-dashed p-8 transition-all sm:p-12 ${dragging ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
      {file ? <div className="mx-auto flex max-w-md items-center gap-4 rounded-xl border border-border bg-background p-4 text-left shadow-sm"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatSize(file.size)}</p></div><Button variant="ghost" size="icon" aria-label="선택한 파일 삭제" onClick={(e) => { e.stopPropagation(); clearFile() }}><Trash2 data-icon="inline-start" /></Button></div> : <><span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Upload size={25} /></span><p className="font-semibold">PDF 파일을 여기에 끌어다 놓으세요</p><p className="mt-2 text-sm text-muted-foreground">또는 클릭해서 파일 선택</p></>}
    </div>
    <p className="mt-4 text-xs text-muted-foreground">텍스트가 포함된 PDF만 지원해요 · 최대 20MB · 20~40페이지 권장</p>
    {error !== 'none' && <div role="alert" className="mt-6 flex w-full items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left text-sm text-destructive"><AlertCircle className="mt-0.5 shrink-0" /><p className="flex-1 leading-6">{errors[error]}</p><Button variant="ghost" size="sm" onClick={retry}>다시 시도</Button></div>}
    <Button size="lg" className="mt-8 w-full max-w-md" disabled={loading || !file} onClick={startAnalysis}>{loading ? <><span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />목차를 분석하고 있습니다...</> : '업로드 및 분석 시작'}</Button>
    {loading && <p className="mt-3 text-sm text-muted-foreground">분석에 시간이 걸리고 있어요. 잠시만 기다려주세요.</p>}
  </section>
}

function OutlineView({ fileLabel, setView, onSelect }: { fileLabel: string; setView: (v: View) => void; onSelect: (i: number) => void }) {
  return <section className="mx-auto w-full max-w-2xl animate-in"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm text-muted-foreground">분석이 완료되었어요</p><h1 className="truncate text-xl font-bold sm:text-2xl">{fileLabel}</h1><p className="mt-3 text-sm text-muted-foreground">목차 {topics.length}개를 찾았어요</p></div><Button variant="outline" className="shrink-0" onClick={() => setView('upload')}><Upload data-icon="inline-start" />새 PDF 업로드</Button></div><div className="flex flex-col gap-3">{topics.map((topic, index) => <button key={topic} onClick={() => onSelect(index)} className="group flex items-center gap-5 rounded-xl border border-border bg-card px-5 py-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span className="flex-1 text-sm font-medium sm:text-base">{index + 1}. {topic}</span><ChevronRight className="text-muted-foreground transition-transform group-hover:translate-x-1" /></button>)}</div></section>
}

function DetailView({ title, tab, setTab, setView, detailError, setDetailError, summaryLoading, quizzes, answers, answer, completed, adding, addMore }: { title: string; tab: 'summary' | 'quiz'; setTab: (v: 'summary' | 'quiz') => void; setView: (v: View) => void; detailError: DetailError; setDetailError: (v: DetailError) => void; summaryLoading: boolean; quizzes: Quiz[]; answers: Record<number, number>; answer: (q: number, o: number) => void; completed: number; adding: boolean; addMore: () => void }) {
  const canAdd = completed === quizzes.length && quizzes.length < 6
  return <section className="mx-auto w-full max-w-2xl animate-in"><Button variant="ghost" className="mb-8 -ml-3 text-muted-foreground" onClick={() => setView('outline')}><ArrowLeft data-icon="inline-start" />목록으로 돌아가기</Button><p className="mb-2 text-sm text-primary">목차 {topics.indexOf(title) + 1}</p><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><div className="mt-8 grid grid-cols-2 rounded-xl border border-border bg-muted p-1"><button aria-selected={tab === 'summary'} onClick={() => setTab('summary')} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === 'summary' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>요약 보기</button><button aria-selected={tab === 'quiz'} onClick={() => setTab('quiz')} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === 'quiz' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>퀴즈 풀기</button></div>{tab === 'summary' ? <Summary error={detailError === 'summary'} loading={summaryLoading} retry={() => setDetailError('none')} /> : <QuizView quizzes={quizzes} answers={answers} answer={answer} completed={completed} canAdd={canAdd} adding={adding} error={detailError === 'quiz' || detailError === 'more'} addMore={addMore} retry={() => setDetailError('none')} />}</section>
}

function Summary({ loading, error, retry }: { loading: boolean; error: boolean; retry: () => void }) { if (loading) return <div className="mt-8 flex flex-col gap-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex gap-4"><SkeletonLine /><SkeletonLine wide={i % 2 === 0} /></div>)}</div>; if (error) return <ErrorBox message="요약을 생성하지 못했어요. 다시 시도해주세요." retry={retry} />; return <ul className="mt-8 flex flex-col gap-5">{summaries.map((text) => <li key={text} className="flex gap-4 text-sm leading-7 text-foreground/85 sm:text-base"><span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" />{text}</li>)}</ul> }
function SkeletonLine({ wide = false }: { wide?: boolean }) { return <div className={`h-5 animate-pulse rounded-md bg-muted ${wide ? 'w-full' : 'w-3/4'}`} /> }
function QuizView({ quizzes, answers, answer, completed, canAdd, adding, error, addMore, retry }: { quizzes: Quiz[]; answers: Record<number, number>; answer: (q: number, o: number) => void; completed: number; canAdd: boolean; adding: boolean; error: boolean; addMore: () => void; retry: () => void }) { return <div className="mt-7"><div className="mb-7"><div className="mb-2 flex justify-between text-sm"><span className="font-medium">진행도</span><span className="text-muted-foreground">{completed} / {quizzes.length} 문항 완료</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / quizzes.length) * 100}%` }} /></div></div>{error ? <ErrorBox message={completed === quizzes.length ? '새로운 문제를 만들지 못했어요. 잠시 후 다시 시도해주세요.' : '퀴즈를 만들지 못했어요. 다시 시도해주세요.'} retry={retry} /> : <div className="flex flex-col gap-5">{quizzes.map((quiz, q) => <QuizCard key={`${quiz.question}-${q}`} quiz={quiz} index={q} selected={answers[q]} onAnswer={(o) => answer(q, o)} />)}{adding && <div className="rounded-xl border border-border bg-card p-6"><div className="mb-5 h-5 w-24 animate-pulse rounded bg-muted" /><div className="flex flex-col gap-3"><SkeletonLine /><SkeletonLine wide /><SkeletonLine /></div></div>}</div>}{canAdd && !adding && !error && <Button variant="outline" className="mt-7 w-full" onClick={addMore}><RotateCcw data-icon="inline-start" />문제 더 풀기</Button>}{adding && <Button disabled className="mt-7 w-full"><span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />새 문제를 만들고 있어요</Button>}</div> }
function QuizCard({ quiz, index, selected, onAnswer }: { quiz: Quiz; index: number; selected?: number; onAnswer: (o: number) => void }) { return <article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">문제 {index + 1}</p><h2 className="text-base font-semibold leading-7">{quiz.question}</h2><div className="mt-5 flex flex-col gap-2">{quiz.options.map((option, i) => { const chosen = selected === i; const correct = selected !== undefined && i === quiz.answer; const wrong = chosen && !correct; return <button key={option} disabled={selected !== undefined} onClick={() => onAnswer(i)} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${correct ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : wrong ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-border hover:border-primary/50 hover:bg-accent'}`}><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/30 text-xs">{correct ? <Check data-icon="inline-start" /> : wrong ? <X data-icon="inline-start" /> : String.fromCharCode(65 + i)}</span>{option}</button> })}</div>{selected !== undefined && <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">{quiz.explanation}</p>}</article> }
function ErrorBox({ message, retry }: { message: string; retry: () => void }) { return <div role="alert" className="mt-8 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="shrink-0" /><span className="flex-1 leading-6">{message}</span><Button variant="ghost" size="sm" onClick={retry}>다시 시도</Button></div> }

function DevPanel({ open, setOpen, view, setView, loading, setLoading, uploadError, setUploadError, detailError, setDetailError, simulatedError }: { open: boolean; setOpen: (v: boolean) => void; view: View; setView: (v: View) => void; loading: boolean; setLoading: (v: boolean) => void; uploadError: UploadError; setUploadError: (v: UploadError) => void; detailError: DetailError; setDetailError: (v: DetailError) => void; simulatedError: string }) { return <aside className="fixed bottom-4 right-4 z-20 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card/95 p-3 text-xs shadow-lg backdrop-blur"><button className="flex w-full items-center justify-between font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen(!open)} aria-expanded={open}><span>개발용 상태 스위처</span><span>{open ? '접기' : '열기'}</span></button>{open && <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3"><label className="flex items-center justify-between gap-3">뷰 상태<select value={view} onChange={(e) => setView(e.target.value as View)} className="rounded-md border border-input bg-background px-2 py-1"><option value="upload">업로드</option><option value="outline">목차 목록</option><option value="detail">상세</option></select></label><label className="flex items-center justify-between gap-3">로딩 <input type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} /></label><label className="flex flex-col gap-1">업로드 오류<select value={uploadError} onChange={(e) => setUploadError(e.target.value as UploadError)} className="rounded-md border border-input bg-background px-2 py-1"><option value="none">없음</option>{Object.entries(errors).map(([key, message]) => <option key={key} value={key}>{message.slice(0, 22)}...</option>)}</select></label><label className="flex flex-col gap-1">상세 오류<select value={detailError} onChange={(e) => setDetailError(e.target.value as DetailError)} className="rounded-md border border-input bg-background px-2 py-1"><option value="none">없음</option><option value="summary">요약 생성 실패</option><option value="quiz">퀴즈 생성 실패</option><option value="more">추가 문제 실패</option></select></label><p className="text-muted-foreground">현재 오류: {simulatedError === 'none' ? '없음' : simulatedError}</p></div>}</aside> }
