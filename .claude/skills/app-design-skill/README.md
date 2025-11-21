# App Design Skill - 모바일 우선 웹앱 UI 가이드

## 개요

Landing Page Guide V2를 웹앱 개발에 맞게 변형한 스킬입니다.

**제거된 요소:**
- SEO 최적화 (URL, 메타태그 등)
- CTA 마케팅 요소
- 독특한 디스플레이 폰트

**추가된 요소:**
- 모바일 우선 UI 패턴
- Pretendard 폰트 전용
- 웹앱 특화 컴포넌트 (Bottom Nav, FAB, 카드 등)
- 템플릿/블록 시스템 가이드
- 다크모드 지원

## 언제 사용하나?

- 모바일 우선 웹앱 개발 시
- Next.js + React 기반 앱
- 개인 생산성, 트래킹, 기록 앱
- 감성적 디자인이 필요한 앱 (추억, 웰니스, 창작)

## 주요 특징

### 1. Pretendard 폰트 전용
- 한국어 최적화
- 깔끔하고 읽기 쉬운 폰트
- 모든 텍스트에 Pretendard 사용
- 독특한 디스플레이 폰트 사용 안 함

### 2. 모바일 UI 패턴
- **Bottom Navigation**: 하단 탭바 (3-5개 섹션)
- **FAB**: 주요 액션 버튼 (추가, 작성 등)
- **Top Bar**: 상단 헤더 (로고, 제목, 액션)
- **Cards**: 콘텐츠 그룹화
- **Bottom Sheet**: 모달 대신 하단 시트
- **Swipe**: 스와이프 제스처 (삭제, 보관 등)

### 3. 감성적 디자인 방향
- **Warm & Nostalgic**: 따뜻한 색감, 추억
- **Clean & Professional**: 깔끔한 그레이, 생산성
- **Playful & Energetic**: 밝은 색상, 즐거움
- **Calm & Minimal**: 미니멀, 집중
- **Modern & Sleek**: 모던, 세련됨

### 4. 웹앱 특화 컴포넌트
- **Dashboard**: 통계, 차트, 최근 활동
- **Template Builder**: 노션 스타일 블록 편집
- **Category Cards**: 미리보기 + 기록 수
- **Dual View**: 일별 뷰 / 요소별 뷰
- **Empty States**: 첫 사용자 경험

## 기술 스택

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI (커스터마이징)
- Pretendard 폰트
- next-themes (다크모드)

## 빠른 시작

### 1. Pretendard 폰트 설정

**Option A: CDN (간단)**
```css
/* app/globals.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

body {
  font-family: 'Pretendard', sans-serif;
}
```

**Option B: Self-Hosted (빠름)**
```typescript
// app/layout.tsx
import localFont from 'next/font/local'

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
})
```

### 2. 디자인 시스템 정의

```css
/* app/globals.css */
:root {
  /* Warm theme */
  --primary: 25 95% 53%;        /* Amber */
  --secondary: 10 80% 50%;      /* Terracotta */
  --background: 0 0% 100%;
  --foreground: 20 10% 10%;
}

.dark {
  --primary: 25 95% 53%;
  --secondary: 10 80% 50%;
  --background: 20 10% 10%;
  --foreground: 0 0% 95%;
}
```

### 3. 레이아웃 구성

```typescript
// components/layout/MainLayout.tsx
<div className="min-h-screen flex flex-col">
  <TopBar />
  <main className="flex-1 pb-20">
    {children}
  </main>
  <BottomNav />
  <FAB />
</div>
```

## 핵심 컴포넌트 예제

### Bottom Navigation
```typescript
<nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
  <div className="flex justify-around h-16">
    <Link href="/" className="flex flex-col items-center">
      <Home className="w-6 h-6" />
      <span className="text-xs">홈</span>
    </Link>
    {/* More tabs... */}
  </div>
</nav>
```

### FAB (Floating Action Button)
```typescript
<Button
  size="lg"
  className="fixed bottom-20 right-4 w-14 h-14 rounded-full"
>
  <Plus className="w-6 h-6" />
</Button>
```

### Category Card
```typescript
<Card className="relative h-48 overflow-hidden">
  <div className="absolute inset-0">
    <Image src={preview} fill className="object-cover" />
  </div>
  <div className="absolute bottom-0 p-4 text-white">
    <h3>{name}</h3>
    <p>{count}개 기록</p>
  </div>
</Card>
```

## 모바일 UX 원칙

1. **한 손 조작**: 엄지 손가락 범위 내 주요 액션
2. **명확한 계층**: 중요한 정보 우선 표시
3. **즉각적 피드백**: 로딩, 애니메이션, 햅틱
4. **용서하는 인터랙션**: 실행 취소, 확인 다이얼로그
5. **점진적 공개**: 세부 정보는 요청 시 표시

## 반응형 디자인

### 모바일 우선 (Mobile-First)
```typescript
// 항상 모바일부터 시작
<div className="p-4 md:p-8">
  {/* 16px (mobile) → 32px (desktop) */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1열 (mobile) → 2열 (tablet) → 3열 (desktop) */}
</div>
```

### 브레이크포인트
- `sm`: 640px (작은 태블릿)
- `md`: 768px (태블릿)
- `lg`: 1024px (데스크톱)
- `xl`: 1280px (대형 데스크톱)

## 다크모드

### 설정
```typescript
// app/providers.tsx
import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}
```

### 사용
```typescript
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  테마 전환
</Button>
```

## 애니메이션

### 페이지 전환
```css
/* Fade */
opacity: 0 → 1
duration: 300ms

/* Slide */
transform: translateX(100%) → translateX(0)
duration: 300ms
```

### 요소 등장
```css
/* Fade up */
opacity: 0
transform: translateY(20px)
→
opacity: 1
transform: translateY(0)
duration: 500ms
```

### 터치 피드백
```css
/* Scale down on press */
scale: 1 → 0.95 → 1
duration: 150ms
```

## 체크리스트

### 디자인 ✅
- [ ] 감성적 방향 선택 완료
- [ ] Pretendard 폰트 적용
- [ ] 색상 팔레트 정의 (CSS variables)
- [ ] 다크모드 구현 및 테스트
- [ ] 애니메이션 부드럽고 목적성 있음
- [ ] 터치 영역 최소 44x44px

### 모바일 UI ✅
- [ ] Bottom Navigation 구현
- [ ] FAB 구현 (해당 시)
- [ ] Top Bar 구현
- [ ] 카드 컴포넌트
- [ ] 폼 최적화 (큰 입력 필드)
- [ ] Empty State
- [ ] Loading State

### 기술 ✅
- [ ] Next.js 15+ App Router
- [ ] TypeScript 타입 정의
- [ ] Tailwind CSS 스타일링
- [ ] ShadCN UI 커스터마이징
- [ ] 반응형 디자인
- [ ] 이미지 최적화
- [ ] 접근성 (WCAG AA)
- [ ] 성능 최적화

### 최종 점검 ✅
- [ ] 실제 모바일 기기 테스트
- [ ] 다크모드 테스트
- [ ] 데스크톱 테스트
- [ ] 키보드 네비게이션
- [ ] 터치 반응 확인
- [ ] 가로 스크롤 없음
- [ ] iOS Safe Area 처리

## Landing Page Guide V2와의 차이점

| 항목 | Landing Page Guide V2 | App Design Skill |
|------|----------------------|------------------|
| **목적** | 랜딩페이지, 마케팅 | 웹앱, 프로덕트 |
| **SEO** | ✅ 포함 | ❌ 제외 |
| **CTA** | ✅ 포함 (전환 중심) | ❌ 제외 |
| **폰트** | 독특한 디스플레이 폰트 | Pretendard 전용 |
| **네비게이션** | 스크롤 기반 | Bottom Nav, FAB |
| **반응형** | 데스크톱 → 모바일 | 모바일 → 데스크톱 |
| **컴포넌트** | Hero, Benefits, Testimonials | Dashboard, Cards, Forms |
| **다크모드** | 선택 | 필수 |

## 사용 예시

### 기록 앱 (Routine Memo)
```
- 따뜻한 색상 (앰버 + 테라코타)
- Category Cards (미리보기)
- Template Builder (노션 스타일)
- Dashboard (통계)
- Dual View (일별/요소별)
```

### 습관 트래커
```
- 깔끔한 색상 (블루 + 그레이)
- Bottom Nav (홈/통계/프로필)
- FAB (습관 추가)
- 달력 뷰
- 연속 일수 표시
```

### 여행 일지
```
- 밝은 색상 (다채로운)
- 사진 중심 카드
- 지도 통합
- 타임라인 뷰
- 갤러리 모드
```

## 참고 자료

- **원본**: [landing-page-guide-v2](../landing-page-guide-v2/)
- **Pretendard**: https://github.com/orioncactus/pretendard
- **ShadCN UI**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Next.js**: https://nextjs.org/

## 라이선스

MIT License (원본 스킬에서 상속)

---

**마지막 업데이트**: 2025-11-21
