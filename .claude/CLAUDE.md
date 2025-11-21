# Routine Memo - 기록 앱 프로젝트

## 프로젝트 개요

**"어떠한 한 가지에 관한 기록을 꾸준히 하는 앱"**

주기와 상관없이, 내 인생의 한 부분을 분류하여 꾸준히 기록하고, 나를 돌아볼 수 있는 추억을 만드는 앱입니다.

### 목적
- 다양한 주제의 기록을 꾸준히 남기기
- 과거 경험을 추억하고 회상할 수 있게
- 나만의 방식으로 기록을 구성할 수 있게

### 사용 사례
- **턱걸이**: 등사진, 갯수, 날짜, Day 등
- **여행**: 사진, 지도, 감상평, 타임라인 등
- **공부**: 글, 사진, 요약 노트, 타임라인 등
- **일기**: 글, 감정, 날짜, 사진 등

## 타겟 사용자

### 넓은 타겟
뭔가를 꾸준히 기록하는 사람들
- 운동 기록
- 여행 기록
- 공부 기록
- 일상 기록

### 코어 타겟
**20~30대 여성**
- 기록과 추억에 민감
- 감성적 콘텐츠 선호
- 시각적 아카이빙에 관심

## 플랫폼 & 기술 스택

### 플랫폼
- **모바일 우선** (375px ~ 768px)
- 데스크톱 지원 (최소한 필요)

### 기술
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI

## 디자인 시스템

### 디자인 방향
- **스타일**: 모던 & 세련됨, 약간 감성있는 느낌
- **분위기**: 따뜻함, 추억, 내 삶의 과정

### 타이포그래피
- **폰트**: Pretendard (Google Fonts)
- 모든 텍스트에 Pretendard 사용
- 독특한 디스플레이 폰트 사용 안 함

### 색상 팔레트
- **메인 컬러**: 따뜻한 계열
  - 앰버/골드 (따뜻한 노란빛, 일몰 느낌)
  - 테라코타/브릭 (붉은 흙, 가을 느낌)
  - 두 색상을 그라데이션으로 혼합
- **다크모드**: 필수 지원

### 애니메이션
- 부드러운 페이드, 슬라이드 애니메이션
- 화면 전환 시 자연스러운 모션
- 과하지 않은 인터랙션

### UI 원칙
- **간결함**: 한 화면에 너무 많은 요소 없이
- **직관성**: 튜토리얼 없이도 사용법 이해 가능
- **감성**: 추억을 담는 느낌의 디자인

## 핵심 기능

### 1. 템플릿 시스템 (노션 스타일)
사용자가 자유롭게 기록 템플릿을 구성할 수 있음

**블록 타입:**
- 텍스트
- 이미지
- 그래프
- 지도
- 날짜
- 숫자
- 감정 등

**작동 방식:**
1. 사용자가 템플릿 생성 (예: "턱걸이 기록")
2. 원하는 블록들을 자유롭게 배치
3. 날짜별로 해당 템플릿에 입력하여 기록 저장

### 2. 카테고리 카드
각 템플릿(카테고리)을 카드 형태로 표시

**카드 구성:**
```
┌─────────────────────────────┐
│  [미리보기 콘텐츠]            │  ← 사용자 지정 블록 or 첫 번째 블록
│  (사진/그래프/텍스트/지도)     │     (배경처럼 크게 표시)
│                             │
│  템플릿 이름                 │  ← 예: "턱걸이 기록"
│  기록 수: 42개               │  ← 누적 기록 개수
└─────────────────────────────┘
```

**미리보기 로직:**
- 사용자가 미리보기 블록 지정 가능
- 미지정 시 → 첫 번째 생성 블록 자동 표시

**예시:**
- **턱걸이 템플릿** (미리보기: 등사진)
  - 배경: 가장 최근 등사진
  - 하단: "턱걸이 기록 / 42개 기록"

- **여행 템플릿** (미리보기: 지도)
  - 배경: 지도 위 핀들
  - 하단: "여행 일지 / 12개 기록"

### 3. 2가지 뷰 모드

#### A) 일별 뷰 (날짜 선택 → 전체 내용)
- 특정 날짜 선택
- 해당 날짜의 템플릿 전체 내용 표시
- 예: 11월 21일 턱걸이 → 등사진 + 갯수 + 날짜 + Day 전체

#### B) 요소별 뷰 (블록 타입별 모아보기)
- 특정 블록 타입만 필터링
- 시간순으로 해당 블록만 표시
- 예: "등사진만 쭉 보기" 또는 "갯수 그래프만 쭉 보기"

### 4. 메인 화면
**통계/대시보드**
- 전체 기록 현황
- 카테고리별 통계
- 최근 활동
- 연속 기록 일수 등

### 5. 네비게이션
**하단 탭바 + 중앙 FAB**
- 하단 탭바 3개 (홈/탐색/프로필 등)
- 중앙에 큰 추가 버튼 (FAB)
- *(추후 변경 가능)*

## 개발 원칙

### 모바일 우선
1. 화면 복잡도 최소화
2. 터치 인터랙션 최적화
3. 스크롤 기반 탐색
4. 한 화면에 하나의 주요 액션

### 직관적 UX
1. 명확한 버튼과 액션
2. 일관된 인터랙션 패턴
3. 즉각적인 피드백
4. 자연스러운 애니메이션

### 감성적 디자인
1. 따뜻한 색감
2. 부드러운 모션
3. 추억을 담는 느낌
4. 시각적으로 아름다운 기록

## 코딩 규칙

### 배포 환경
- **배포 플랫폼**: Vercel
- **프레임워크**: Next.js 15 (App Router)
- **TypeScript**: 필수

### CSS 작성 규칙

#### 1. 인라인 CSS 금지
❌ **절대 금지:**
```tsx
<div style={{ color: 'red', padding: '10px' }}>
  Content
</div>
```

✅ **올바른 방법:**
```tsx
// Component.tsx
import './Component.css'

<div className="container">
  Content
</div>
```

#### 2. CSS 파일 분리 및 위치
- **컴포넌트별로 CSS 파일 분리**
- **CSS 파일은 해당 컴포넌트와 같은 폴더에 위치**

**폴더 구조 예시:**
```
components/
├── CategoryCard/
│   ├── CategoryCard.tsx
│   ├── CategoryCard.css          ← 컴포넌트와 같은 폴더
│   └── index.ts
├── Dashboard/
│   ├── Dashboard.tsx
│   ├── Dashboard.css             ← 컴포넌트와 같은 폴더
│   └── index.ts
```

#### 3. Tailwind CSS 사용
- 기본적으로 Tailwind CSS 사용
- 복잡한 스타일이나 반복되는 패턴은 별도 CSS 파일로 분리
- CSS 모듈 사용 가능 (`.module.css`)

### 로직 분리 규칙

#### 1. 로직별로 파일 분리
- **한 파일에 모든 로직을 몰아넣지 않기**
- **로직별로 독립적인 파일로 분리 후 import**

❌ **나쁜 예:**
```tsx
// Dashboard.tsx (1000줄)
export default function Dashboard() {
  // 데이터 fetch 로직 200줄
  // 통계 계산 로직 300줄
  // 차트 생성 로직 200줄
  // UI 렌더링 300줄
}
```

✅ **좋은 예:**
```tsx
// Dashboard.tsx (100줄)
import { useDashboardData } from './useDashboardData'
import { calculateStats } from './calculateStats'
import { ChartRenderer } from './ChartRenderer'

export default function Dashboard() {
  const data = useDashboardData()
  const stats = calculateStats(data)

  return <ChartRenderer stats={stats} />
}

// useDashboardData.ts (80줄)
export function useDashboardData() {
  // 데이터 fetch 로직
}

// calculateStats.ts (100줄)
export function calculateStats(data) {
  // 통계 계산 로직
}

// ChartRenderer.tsx (120줄)
export function ChartRenderer({ stats }) {
  // 차트 생성 및 렌더링
}
```

#### 2. 로직 파일 위치 규칙

**A) 여러 컴포넌트에서 사용하는 로직**
→ `lib/utils/` 또는 `lib/helpers/` 폴더에 위치

```
lib/
├── utils/
│   ├── dateUtils.ts              ← 날짜 관련 유틸
│   ├── formatters.ts             ← 포맷팅 유틸
│   └── validators.ts             ← 검증 유틸
├── helpers/
│   ├── statsCalculator.ts        ← 통계 계산
│   └── chartHelpers.ts           ← 차트 헬퍼
```

**B) 특정 컴포넌트에서만 사용하는 로직**
→ 해당 컴포넌트와 같은 폴더에 위치

```
components/
├── Dashboard/
│   ├── Dashboard.tsx             ← 메인 컴포넌트
│   ├── Dashboard.css
│   ├── useDashboardData.ts       ← Dashboard 전용 hook
│   ├── calculateStats.ts         ← Dashboard 전용 로직
│   └── index.ts
```

#### 3. 파일 길이 제한
- **이상적인 파일 길이: 500줄 이하**
- 500줄 이상 시 로직을 추가 분리
- 복잡도가 높은 경우 300줄 이하 권장

**분리 기준:**
- 독립적인 기능/책임
- 재사용 가능성
- 테스트 용이성

### 폴더 구조 예시

```
app/
├── page.tsx                      ← 메인 페이지 (100줄 이하)
├── dashboard/
│   ├── page.tsx                  ← 대시보드 페이지 (100줄 이하)
│   └── layout.tsx
└── globals.css

components/
├── CategoryCard/
│   ├── CategoryCard.tsx          ← 컴포넌트 (150줄)
│   ├── CategoryCard.css          ← 스타일
│   ├── useCategoryData.ts        ← 전용 로직 (100줄)
│   └── index.ts
├── Dashboard/
│   ├── Dashboard.tsx             ← 메인 (120줄)
│   ├── Dashboard.css
│   ├── StatCard.tsx              ← 서브 컴포넌트 (80줄)
│   ├── StatCard.css
│   ├── useDashboardData.ts       ← 전용 hook (150줄)
│   └── index.ts
└── ui/                           ← ShadCN 컴포넌트

lib/
├── utils/
│   ├── dateUtils.ts              ← 공통 유틸 (200줄)
│   ├── formatters.ts             ← 공통 유틸 (150줄)
│   └── validators.ts             ← 공통 유틸 (180줄)
├── hooks/
│   ├── useLocalStorage.ts        ← 공통 hook (100줄)
│   └── useMediaQuery.ts          ← 공통 hook (60줄)
├── types/
│   └── index.ts                  ← 타입 정의
└── constants/
    └── index.ts                  ← 상수 정의
```

### 코드 작성 체크리스트

코드 작성 시 다음을 확인하세요:

- [ ] 인라인 CSS 사용하지 않았는가?
- [ ] CSS 파일이 컴포넌트와 같은 폴더에 있는가?
- [ ] 한 파일이 500줄을 넘지 않는가?
- [ ] 로직이 적절히 분리되어 있는가?
- [ ] 공통 로직은 `lib/utils/`에 있는가?
- [ ] 컴포넌트 전용 로직은 컴포넌트 폴더에 있는가?
- [ ] TypeScript 타입이 명시되어 있는가?
- [ ] import 경로가 명확한가?

### 예외 사항

다음 경우는 예외적으로 허용:

1. **Tailwind CSS 클래스명**: 인라인 사용 가능
   ```tsx
   <div className="flex items-center gap-4">
   ```

2. **동적 스타일**: CSS 변수 사용
   ```tsx
   <div style={{ '--custom-color': color } as React.CSSProperties}>
   ```

3. **라이브러리 컴포넌트**: 라이브러리가 요구하는 경우
   ```tsx
   <Component style={requiredByLibrary} />
   ```

## 참고 사항

### 서버 구조
- 초기: 프론트엔드 중심 개발
- 추후: 서버 추가 예정
- 폰트: Google Fonts 사용 (서버 운영 고려)

### 확장 가능성
- 다양한 블록 타입 추가 가능
- 템플릿 공유 기능 (미래)
- 소셜 기능 (미래)
- 데이터 내보내기/가져오기

## 개발 우선순위

### Phase 1: MVP
1. 템플릿 생성 및 편집
2. 기본 블록 타입 (텍스트, 이미지, 숫자, 날짜)
3. 일별 기록 입력
4. 일별 뷰
5. 카테고리 카드 표시

### Phase 2: 핵심 기능
1. 요소별 뷰
2. 통계 대시보드
3. 다크모드
4. 추가 블록 타입 (그래프, 지도, 감정)

### Phase 3: 고도화
1. 서버 연동
2. 데이터 동기화
3. 검색 기능
4. 필터링/정렬

## Claude에게 요청 시 참고

### 코드 작성 시
- 항상 TypeScript 사용
- Tailwind CSS로 스타일링
- ShadCN UI 컴포넌트 활용
- 모바일 우선 반응형
- Pretendard 폰트 사용

### 디자인 결정 시
- 따뜻한 색상 팔레트 유지
- 감성적이고 부드러운 느낌
- 복잡하지 않게, 직관적으로
- 추억과 기록의 느낌

### 기능 구현 시
- 노션처럼 자유로운 블록 시스템
- 날짜 기반 기록 관리
- 2가지 뷰 모드 지원
- 카테고리 카드 미리보기

---

**마지막 업데이트**: 2025-11-21
