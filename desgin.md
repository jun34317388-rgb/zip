# Academic Intelligence System (Scholarly Ambient)

본 디자인 시스템은 AI PDF 강의자료 분석 서비스의 신뢰성, 가독성, 그리고 학습 몰입도를 극대화하기 위해 설계되었습니다.

## 1. 비주얼 컨셉: Scholarly Ambient
- **Trustworthy**: 깊은 인디고 컬러를 사용하여 전문적인 학술 도구로서의 신뢰감을 부여합니다.
- **Breathable**: 넓은 여백과 부드러운 배경색을 사용하여 장시간 학습에도 시각적 피로를 최소화합니다.
- **Structured**: 카드 기반 레이아웃과 명확한 타이포그래피 위계를 통해 복잡한 정보를 직관적으로 구조화합니다.

## 2. 색상 체계 (Color Palette)
- **Primary**: `#1f108e` (Academic Indigo) - 브랜드의 핵심 컬러이며, 버튼, 강조 텍스트, 활성 상태에 사용됩니다.
- **Surface**: `#fcf8ff` (Soft Lavender White) - 화면 전체의 기본 배경색으로, 순백색보다 눈이 편안한 톤을 제공합니다.
- **Container**: `#ffffff` (Pure White) - 각 섹션이나 카드 컴포넌트의 배경색으로 사용되어 정보의 독립성을 부여합니다.
- **Outline**: `#dcd8e3` (Muted Slate) - 컴포넌트 간의 경계나 비활성 상태의 구분선에 사용됩니다.

## 3. 타이포그래피 (Typography)
- **Font Family**: `Inter`, sans-serif (가독성과 현대적인 느낌 강조)
- **Scale**:
    - **Display**: 챕터 제목이나 대형 헤드라인 (Bold, 32px+)
    - **Headline**: 카드 제목이나 섹션 헤드라인 (Semi-Bold, 20-24px)
    - **Body**: 요약 내용 및 일반 텍스트 (Regular, 16px, Line-height 1.6)
    - **Label**: 버튼, 태그, 캡션 (Medium, 14px)

## 4. 컴포넌트 가이드라인
- **Card**: `8px`의 둥근 모서리(ROUND_EIGHT)와 매우 연한 그림자 또는 가는 보더를 사용하여 입체감을 부여합니다.
- **Navigation**: 상단 바는 배경색과 대비되는 그림자 없이 얇은 보더(`border-b`)로 구분하여 깔끔한 인상을 유지합니다.
- **Interaction**: 버튼 클릭 시 `scale-95` 정도의 미세한 트랜지션을 주어 반응성을 높입니다.
- **Layout**: 데스크톱 기준 최대 폭을 제한하여 정보가 너무 넓게 퍼지지 않도록 관리합니다.