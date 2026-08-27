export interface SampleLecture {
  id: string;
  title: string;
  badge: string;
  description: string;
  pageCount: number;
  fileName: string;
  fullText: string;
}

export const SAMPLE_LECTURES: SampleLecture[] = [
  {
    id: 'os-lecture',
    title: '운영체제와 컴퓨터 구조 핵심 강의',
    badge: '컴퓨터공학 전공',
    description: '프로세스 관리, CPU 스케줄링, 가상 메모리 페이징 기법',
    pageCount: 28,
    fileName: 'OS_ComputerArchitecture_Lecture_Ch1_3.pdf',
    fullText: `[Chapter 1. 운영체제 개요 및 프로세스 관리]
운영체제(Operating System)는 컴퓨터 하드웨어와 사용자 응용 프로그램 사이에서 자원을 효율적으로 관리하고 인터페이스를 제공하는 시스템 소프트웨어입니다.
운영체제의 핵심 기능은 프로세스 관리, 메모리 관리, 파일 시스템 관리, 입출력 장치 관리로 나뉩니다.
프로세스(Process)는 메모리에 적재되어 실행 중인 프로그램 인스턴스를 의미합니다. 프로세스는 실행에 필요한 코드(Code), 데이터(Data), 힙(Heap), 스택(Stack) 영역으로 구성됩니다.
프로세스의 상태는 New(생성), Ready(준비), Running(실행), Waiting/Blocked(대기), Terminated(종료)의 5가지 기본 상태 전이를 가집니다.
프로세스 제어 블록(Process Control Block, PCB)은 각 프로세스의 상태, 프로그램 카운터(PC), 레지스터 정보, 메모리 한계치 등을 저장하는 커널 자료구조입니다.
문맥 교환(Context Switch)은 CPU가 현재 실행 중인 프로세스의 상태를 PCB에 저장하고, 새로운 프로세스의 PCB 정보를 레지스터에 복원하는 작업을 말하며 오버헤드가 발생합니다.

[Chapter 2. CPU 스케줄링 및 프로세스 동기화]
CPU 스케줄링은 Ready 큐에 대기 중인 프로세스 중 어떤 프로세스에 CPU를 할당할지 결정하는 정책입니다.
대표적인 비선점형 스케줄링에는 FCFS(First-Come First-Served), SJF(Shortest Job First)가 있으며, 선점형 스케줄링에는 Round Robin(RR), SRTF(Shortest Remaining Time First), Multi-Level Queue가 있습니다.
Round Robin 스케줄링은 각 프로세스에 동일한 시간 할당량(Time Quantum)을 부여하여 시분할 방식으로 동작합니다. 시간 할당량이 너무 크면 FCFS와 같아지고, 너무 작으면 잦은 문맥 교환으로 오버헤드가 급증합니다.
프로세스 동기화(Synchronization)는 다중 프로세스가 공유 자원에 동시 접근할 때 데이터 일관성을 유지하기 위해 필요합니다.
임계 구역(Critical Section)은 공유 자원에 접근하는 코드 영역으로, 상호 배제(Mutual Exclusion), 진행(Progress), 유한 대기(Bounded Waiting)의 3가지 조건을 반드시 만족해야 합니다.
세마포어(Semaphore)와 뮤텍스(Mutex)는 임계 구역 문제를 해결하기 위한 대표적인 동기화 도구입니다. 교착 상태(Deadlock)는 둘 이상의 프로세스가 서로가 가진 자원을 무한정 기다리는 상태로, 상호 배제, 점유 및 대기, 비선점, 환형 대기의 4가지 조건이 동시에 성립할 때 발생합니다.

[Chapter 3. 가상 메모리 및 페이징 시스템]
가상 메모리(Virtual Memory)는 실제 물리 메모리 크기보다 더 큰 프로세스를 실행할 수 있도록 보조기억장치(디스크)의 일부를 메모리처럼 사용하는 기법입니다.
페이징(Paging) 기법은 가상 메모리를 동일한 크기의 블록인 페이지(Page)로 나누고, 물리 메모리를 동일한 크기의 프레임(Frame)으로 나누어 매핑하는 방식입니다.
페이지 테이블(Page Table)은 가상 주소의 페이지 번호를 물리 주소의 프레임 번호로 변환하는 데 사용됩니다.
주소 변환 속도를 향상시키기 위해 하드웨어 캐시 메모리인 TLB(Translation Lookaside Buffer)를 사용하여 자주 참조되는 페이지 테이블 엔트리를 캐싱합니다.
페이지 폴트(Page Fault)는 프로세스가 접근하려는 페이지가 현재 물리 메모리에 없을 때(Invalid 상태) 발생하는 인터럽트입니다. 페이지 폴트 발생 시 운영체제는 디스크의 스왑 영역에서 해당 페이지를 찾아 빈 프레임에 적재합니다.
페이지 교체 알고리즘(Page Replacement Algorithm)에는 FIFO(First-In First-Out), OPT(Optimal, 이론적 최적), LRU(Least Recently Used), LFU(Least Frequently Used)가 있습니다.
스래싱(Thrashing)은 페이지 폴트가 지나치게 빈번하게 발생하여 CPU가 실제 프로세스 연산보다 페이지 교체 입출력 작업에 대부분의 시간을 소모하는 현상을 의미하며, 워킹셋(Working Set) 모델이나 PFF(Page Fault Frequency) 알고리즘으로 방지합니다.`,
  },
  {
    id: 'db-lecture',
    title: '데이터베이스 시스템 및 트랜잭션 실무',
    badge: '데이터 엔지니어링',
    description: '관계형 데이터 모델, 정규화 과정(1NF~3NF), ACID 및 인덱싱 원리',
    pageCount: 32,
    fileName: 'Database_System_Transactions_Ch1_3.pdf',
    fullText: `[Chapter 1. 관계형 데이터 모델과 SQL 기초]
관계형 데이터베이스(RDBMS)는 데이터를 행(Row/Tuple)과 열(Column/Attribute)로 구성된 2차원 테이블(Relation) 형태로 구조화하여 관리하는 시스템입니다.
테이블 간의 관계는 기본키(Primary Key)와 외래키(Foreign Key)를 통해 정의됩니다.
기본키(PK)는 테이블 내의 각 행을 고유하게 식별할 수 있는 유일성(Uniqueness)과 최소성(Minimality)을 만족하며, NULL 값을 가질 수 없는 개체 무결성(Entity Integrity)을 가집니다.
외래키(FK)는 다른 테이블의 기본키를 참조하는 속성으로, 참조 무결성(Referential Integrity) 제약조건을 준수해야 합니다.
SQL(Structured Query Language)은 관계형 데이터베이스와 상호작용하는 표준 언어로, 데이터 정의어(DDL), 데이터 조작어(DML), 데이터 제어어(DCL), 트랜잭션 제어어(TCL)로 분류됩니다.
SELECT 쿼리의 실행 순서는 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY 순서로 진행됩니다.

[Chapter 2. 데이터베이스 정규화 (1NF ~ BCNF)]
정규화(Normalization)는 데이터베이스 설계 시 중복을 최소화하고 이상 현상(Anomaly: 삽입 이상, 갱신 이상, 삭제 이상)을 방지하기 위해 릴레이션을 분해하는 과정입니다.
제1정규형(1NF)은 테이블의 모든 도메인이 더 이상 분해될 수 없는 원자값(Atomic Value)으로만 구성되도록 중복 그룹을 제거하는 단계입니다.
제2정규형(2NF)은 1NF를 만족하고, 기본키의 진부분집합에 종속되는 부분 함수 종속(Partial Functional Dependency)을 제거하여 완전 함수 종속(Full Functional Dependency)을 만족하도록 분해하는 단계입니다.
제3정규형(3NF)은 2NF를 만족하고, 기본키가 아닌 일반 속성 간에 발생하는 이행적 함수 종속(Transitive Functional Dependency, A→B, B→C 일 때 A→C)을 제거하는 단계입니다.
보이스-코드 정규형(BCNF)은 모든 결정자(Determinant)가 반드시 후보키(Candidate Key)가 되도록 강한 제3정규형 조건을 만족시키는 분해 과정입니다.
역정규화(Denormalization)는 지나친 조인(Join) 연산으로 인한 성능 저하를 방지하기 위해 의도적으로 중복을 허용하는 최적화 기법입니다.

[Chapter 3. 트랜잭션, ACID 속성 및 인덱스]
트랜잭션(Transaction)은 데이터베이스의 상태를 변경하는 논리적 작업의 완전한 최소 단위입니다.
트랜잭션은 4가지 핵심 ACID 속성을 만족해야 합니다:
1. 원자성(Atomicity): 작업이 모두 성공(Commit)하거나 모두 취소(Rollback)되어 전부 반영되거나 전혀 반영되지 않아야 합니다.
2. 일관성(Consistency): 트랜잭션 완료 후에도 데이터베이스는 정의된 무결성 제약조건을 항상 만족해야 합니다.
3. 격리성(Isolation): 동시에 실행되는 여러 트랜잭션이 서로 간섭하지 못하도록 고립 수준(Isolation Level)을 유지해야 합니다.
4. 지속성(Durability): 성공적으로 완료된 트랜잭션의 결과는 시스템 장애가 발생하더라도 영구적으로 보존되어야 합니다.
인덱스(Index)는 데이터 검색 속도를 향상시키기 위해 테이블의 특정 컬럼을 정렬하여 별도로 구성한 자료구조입니다.
대표적인 인덱스 자료구조인 B+Tree는 모든 리프 노드가 동일한 깊이에 위치하고 연결 리스트로 이어져 있어 범위 검색(Range Scan)에 매우 효율적입니다.
인덱스를 무분별하게 과도하게 생성하면 SELECT 성능은 향상될 수 있으나, INSERT, UPDATE, DELETE 시 인덱스 재정렬 비용이 발생하여 쓰기 성능이 저하됩니다.`,
  },
  {
    id: 'swe-lecture',
    title: '소프트웨어 공학 및 객체지향 설계 원칙',
    badge: '소프트웨어 설계',
    description: '애자일 개발 방법론, 객체지향 5대 SOLID 원칙, 핵심 GoF 디자인 패턴',
    pageCount: 25,
    fileName: 'Software_Engineering_SOLID_DesignPatterns.pdf',
    fullText: `[Chapter 1. 소프트웨어 개발 수명주기와 애자일 방법론]
소프트웨어 개발 수명주기(SDLC, Software Development Life Cycle)는 요구사항 분석, 설계, 구현, 테스팅, 배포 및 유지보수의 전체 개발 단계를 의미합니다.
전통적인 폭포수(Waterfall) 모델은 각 단계가 순차적으로 진행되며 요구사항 변경 수용이 어려운 반면, 애자일(Agile) 방법론은 짧은 반복 주기(Sprint/Iteration)를 통해 지속적으로 동작 가능한 소프트웨어를 제공하고 고객과의 협력을 강조합니다.
스크럼(Scrum) 프레임워크는 제품 백로그(Product Backlog), 스프린트 백로그(Sprint Backlog), 일일 스크럼 미팅(Daily Scrum), 스프린트 리뷰 및 회고(Sprint Retrospective)로 구성됩니다.
지속적 통합(CI, Continuous Integration)과 지속적 배포(CD, Continuous Deployment)는 자동화된 빌드 및 테스트 파이프라인을 통해 코드 품질을 유지하고 신속하게 릴리스하는 현대적 엔지니어링 실무입니다.

[Chapter 2. 객체지향 5대 설계 원칙 (SOLID)]
SOLID 원칙은 유지보수가 용이하고 확장에 유연한 객체지향 소프트웨어를 설계하기 위한 5대 기본 원칙입니다:
1. 단일 책임 원칙 (SRP, Single Responsibility Principle): 하나의 클래스는 오직 하나의 변경 이유(책임)만을 가져야 합니다.
2. 개방-폐쇄 원칙 (OCP, Open-Closed Principle): 소프트웨어 개체는 확장에는 열려 있어야 하고(Open for extension), 수정에는 닫혀 있어야(Closed for modification) 합니다. 추상화와 다형성을 통해 달성합니다.
3. 리스코프 치환 원칙 (LSP, Liskov Substitution Principle): 하위 타입 객체는 상위 타입 객체를 대체하여 프로그램의 정확성을 해치지 않고 동작할 수 있어야 합니다.
4. 인터페이스 분리 원칙 (ISP, Interface Segregation Principle): 클라이언트는 자신이 사용하지 않는 메서드에 의존하지 않아야 하며, 범용 인터페이스 하나보다 목적에 특화된 여러 개의 인터페이스가 바람직합니다.
5. 의존역전 원칙 (DIP, Dependency Inversion Principle): 상위 수준 모듈은 하위 수준 모듈의 구현에 직접 의존해서는 안 되며, 둘 다 추상화(인터페이스)에 의존해야 합니다.

[Chapter 3. 핵심 디자인 패턴 (GoF Design Patterns)]
디자인 패턴(Design Pattern)은 소프트웨어 설계에서 자주 발생하는 문제들에 대한 재사용 가능한 모범적인 해결책입니다.
디자인 패턴은 생성(Creational), 구조(Structural), 행위(Behavioral)의 3개 카테고리로 분류됩니다.
1. 싱글톤 패턴(Singleton Pattern): 클래스의 인스턴스가 오직 하나만 생성되도록 보장하고 이에 대한 전역적인 접근점을 제공하는 생성 패턴입니다.
2. 팩토리 메서드 패턴(Factory Method Pattern): 객체 생성 책임을 서브클래스에 위임하여 인스턴스화할 클래스를 서브클래스가 결정하도록 하는 패턴입니다.
3. 어댑터 패턴(Adapter Pattern): 호환되지 않는 인터페이스를 가진 두 클래스가 함께 동작할 수 있도록 중간에서 변환해주는 구조 패턴입니다.
4. 전략 패턴(Strategy Pattern): 알고리즘 군을 정의하고 각각을 캡슐화하여 실행 시점에 알고리즘을 상호 교체할 수 있도록 만드는 행위 패턴입니다.
5. 옵저버 패턴(Observer Pattern): 한 객체의 상태 변화가 발생했을 때 의존하는 여러 객체들에게 자동으로 통지하고 갱신되도록 1:N 의존관계를 정의하는 패턴입니다.`,
  },
];
