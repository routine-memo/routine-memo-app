# Claude Self-Review Loop - 사용 가이드

## 개요

**Claude Self-Review Loop**는 외부 API 없이 Claude 혼자서 고품질 코드를 보장하는 자체 검증 시스템입니다.

## 자동 활성화 조건

### 조건 1: 복잡한 새 로직 추가 시 ✨

다음과 같은 요청이 들어오면 **자동으로 활성화**됩니다:

#### 활성화되는 경우 ✅
- "로그인 기능 추가해줘"
- "결제 시스템 구현해줘"
- "대용량 데이터 처리 로직 만들어줘"
- "이 코드 리팩토링해줘"
- "인증/인가 시스템 추가해줘"

#### 활성화되지 않는 경우 ❌
- "변수명 바꿔줘"
- "주석 추가해줘"
- "console.log 제거해줘"
- "오타 수정해줘"

### 조건 2: 같은 문제 3회 이상 반복 시 🔄

세션 내에서 **동일한 유형의 문제**가 3번 이상 발생하면 자동 활성화됩니다:

#### 추적하는 문제 유형
- 같은 에러 메시지 3회 이상
- 같은 테스트 실패 3회 이상
- 같은 타입 에러 패턴 3회 이상
- 같은 로직 버그 패턴 3회 이상
- 사용자가 같은 종류의 수정 요청 3회 이상

#### 예시
```
1차: TypeError: Cannot read property 'id' of undefined
2차: TypeError: Cannot read property 'name' of undefined
3차: TypeError: Cannot read property 'email' of undefined

⚠️ 감지: Null 체크 누락 문제 3회 발생
🔄 Self-Review Loop 활성화 - 근본 원인 분석 시작
```

## 5단계 프로세스

### Stage 1: 계획 수립 📋
- 요구사항 분석
- 아키텍처 결정
- 단계별 구현 계획
- 엣지 케이스 정리
- 보안 고려사항

### Stage 2: 계획 자체 검증 🔍
- 로직 결함 검토
- 엣지 케이스 누락 확인
- 보안 취약점 분석
- 성능 문제 예측
- 베스트 프랙티스 준수 확인

**문제 발견 시**: 계획 수정 후 재검증

### Stage 3: 구현 🔨
- 검증된 계획대로 코드 작성
- 클린 코드 원칙 준수
- 에러 핸들링 추가
- 보안 베스트 프랙티스 적용

### Stage 4: 코드 자체 리뷰 👀
- 구현된 코드 읽기
- 버그 탐지
- 보안 검사
- 성능 분석
- 유지보수성 평가

### Stage 5: 이슈 수정 & 재검증 🔧
- 발견된 문제 수정
- 수정 사항 재검토
- 새로운 문제 발생 여부 확인
- 최종 승인

## 사용 예제

### 예제 1: 복잡한 신규 기능

```
👤 사용자: "OAuth 2.0 로그인 기능 추가해줘"

🤖 Claude:
🔄 Self-Review Loop 활성화 (복잡한 보안 기능 감지)

📋 Stage 1/5: 계획 수립
[OAuth 2.0 구현 계획 작성]
- Authorization code flow
- Token 관리
- CSRF 보호
- State 파라미터 검증

🔍 Stage 2/5: 계획 자체 검증
제 계획을 비판적으로 검토하겠습니다...
⚠️ 발견된 이슈:
1. Refresh token rotation 누락
2. Token 만료 검증 없음
3. Redirect URI 검증 불완전

🔄 계획 수정 중...
✅ 재검증 통과

🔨 Stage 3/5: 구현
[코드 작성 중...]

👀 Stage 4/5: 코드 자체 리뷰
구현된 코드 검토 중...
⚠️ 발견된 이슈:
1. 🔴 Critical: 클라이언트 시크릿 하드코딩 (보안 위험)
2. 🟡 Warning: 토큰 엔드포인트에 rate limiting 없음

🔧 Stage 5/5: 이슈 수정
[수정 적용 중...]
- 클라이언트 시크릿 → 환경변수로 이동
- Rate limiting 미들웨어 추가

✅ 모든 이슈 해결 완료!
✅ OAuth 구현 완료 및 보안 검증 완료!
```

### 예제 2: 반복 문제 (3회 이상)

```
세션 타임라인:

[작업 1]
TypeError: Cannot read property 'id' of undefined
→ 빠른 수정 적용

[작업 2]
TypeError: Cannot read property 'name' of undefined
→ 빠른 수정 적용

[작업 3]
TypeError: Cannot read property 'email' of undefined

⚠️ 감지: Null 참조 에러가 3회 발생했습니다
🔄 Self-Review Loop 활성화 - 근본 원인 분석

## 근본 원인 분석

문제: Null/undefined 속성 접근 반복
공통 요인: API 응답을 검증 없이 접근
근본 원인: 중앙화된 데이터 검증 레이어 부재

## 시스템적 해결책 구현

1️⃣ 유틸리티 함수 생성:
```typescript
// utils/validate.ts
export function validateApiResponse<T>(data: unknown): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response');
  }
  return data as T;
}
```

2️⃣ 타입 가드 생성:
```typescript
// types/guards.ts
export function isUser(obj: any): obj is User {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string';
}
```

3️⃣ 모든 API 호출 지점 업데이트:
[8개 파일 선제적으로 업데이트]

✅ 예방 조치 완료!
이제 이 패턴으로 향후 null 참조 에러를 방지합니다.
```

## 주요 특징

### ✅ 장점

1. **무료** - 외부 API 없이 Claude만 사용
2. **빠름** - 외부 호출 없어 응답 속도 빠름
3. **컨텍스트 유지** - 같은 세션 내에서 작업
4. **즉시 수정** - 발견 즉시 Edit/Write로 수정
5. **근본 원인 해결** - 반복 문제는 시스템적으로 해결

### 🎯 적합한 경우

- 일반적인 웹/앱 개발
- 복잡한 비즈니스 로직
- 보안이 중요한 기능
- 리팩토링 작업
- 같은 실수 반복 방지

### 📊 품질 보장

- **5단계 검증**: 계획 → 검증 → 구현 → 리뷰 → 수정
- **자체 비평**: Claude가 자기 코드를 비판적으로 검토
- **반복 추적**: 3회 반복 시 근본 원인 해결
- **문서화**: 모든 결정과 발견 사항 기록

## 비활성화 방법

스킬이 자동 활성화되지 않길 원하면:

```
User: "간단하게만 해줘" 또는 "빠르게만 해줘"
```

이렇게 요청하면 Loop를 건너뜁니다.

## 수동 활성화 방법

간단한 작업이라도 Loop를 원하면:

```
User: "Self-Review Loop 사용해서 [작업] 해줘"
```

## 프로세스 흐름도

```
새 복잡한 로직 OR 3회 반복 문제
          ↓
    📋 계획 수립
          ↓
    🔍 자체 검증 → 이슈? → 수정 → 재검증
          ↓
    🔨 구현
          ↓
    👀 코드 리뷰 → 이슈? → 🔧 수정
          ↓                    ↓
    🔧 재검증 ←──────────────┘
          ↓
    ✅ 고품질 코드 완성
```

## 문제 추적 시스템

### 세션 시작 시
```
Issue Tracker 초기화:
- error_patterns: {}
- test_failures: {}
- lint_errors: {}
- user_fix_requests: {}
```

### 문제 발생 시
```
1. 문제 유형/패턴 식별
2. 해당 패턴 카운터 증가
3. 카운트 >= 3 확인
4. 조건 충족 시 Loop 활성화
```

## FAQ

### Q: 모든 작업에 Loop가 활성화되나요?
A: 아니요. 복잡한 로직 추가 또는 3회 반복 문제 발생 시만 자동 활성화됩니다.

### Q: Loop 없이 빠르게 작업하고 싶어요
A: "간단하게만 해줘" 또는 "빠르게만 해줘"라고 요청하세요.

### Q: Codex Loop와 차이점은?
A: Codex Loop는 외부 API 필요 + 비용 발생. Self-Review Loop는 무료 + 빠름.

### Q: 품질 차이는?
A: Claude 단독도 충분히 높은 품질. Critical 시스템이 아니면 Self-Review Loop로 충분.

## 관련 스킬

- **codex-claude-loop**: 외부 Codex API 사용 (유료, 최고 품질)
- **claude-self-review-loop**: Claude 단독 (무료, 높은 품질) ← 이 스킬

## 라이선스

MIT License
