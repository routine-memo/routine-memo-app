# Claude Self-Review Loop - 빠른 시작

## 1분 요약

**복잡한 로직 추가** 또는 **같은 문제 3회 반복** 시 자동으로 5단계 품질 검증 프로세스가 실행됩니다.

## 빠른 사용법

### 자동 활성화 (권장)

```bash
# 복잡한 기능 요청 → 자동 활성화
User: "OAuth 로그인 추가해줘"
User: "결제 시스템 만들어줘"
User: "이 코드 리팩토링해줘"

# 같은 에러 3회 발생 → 자동 활성화
[1회] TypeError: ...
[2회] TypeError: ...
[3회] TypeError: ... → 🔄 Loop 활성화!
```

### 수동 활성화

```bash
# 간단한 작업도 Loop 적용하고 싶을 때
User: "Self-Review Loop 사용해서 변수명 리팩토링해줘"
```

### 비활성화

```bash
# Loop 건너뛰고 빠르게 작업
User: "간단하게만 해줘"
User: "빠르게만 해줘"
```

## 5단계 프로세스

```
📋 계획 → 🔍 검증 → 🔨 구현 → 👀 리뷰 → 🔧 수정
```

## 실전 예제

### 예제 1: 신규 기능

```
User: "로그인 기능 추가해줘"

Claude:
🔄 Self-Review Loop 활성화

📋 1/5: 계획 작성
🔍 2/5: 자체 검증 → ⚠️ CSRF 보호 누락 발견 → 수정
🔨 3/5: 구현 완료
👀 4/5: 코드 리뷰 → ⚠️ Rate limiting 없음 발견
🔧 5/5: 이슈 수정 → ✅ 완료!
```

### 예제 2: 반복 문제

```
[작업 1] TypeError: undefined.id
[작업 2] TypeError: undefined.name
[작업 3] TypeError: undefined.email

⚠️ 3회 반복 감지!
🔄 Self-Review Loop 활성화 - 근본 원인 해결

→ Validation 유틸리티 생성
→ 8개 파일 선제적 업데이트
→ ✅ 향후 재발 방지
```

## 주요 장점

| 항목 | Self-Review Loop |
|------|------------------|
| 비용 | 무료 (Claude만) |
| 속도 | 빠름 |
| 품질 | 높음 |
| 적용 | 자동 |

## 다음 단계

- [전체 문서](./SKILL.md) 읽기
- [사용 가이드](./README.md) 확인
- 실제 프로젝트에 적용해보기

---

**TIP**: 복잡한 기능 개발 시 "Self-Review Loop 사용해줘"라고 명시하면 더 철저한 검증을 받을 수 있습니다!
