# 지도 블록 구현

**날짜**: 2025-12-02
**커밋**: `f6e7327`, `1ab93c0`
**브랜치**: dev

---

## 개요

카카오맵 API를 활용하여 지도 블록 기능을 구현했습니다. 사용자가 맛집, 카페 등 개인적인 장소를 마커로 저장하고 관리할 수 있는 기능입니다.

---

## 구현 내용

### 1. 새로 생성된 파일

| 파일 | 설명 |
|------|------|
| `app/template/new/components/MapBlockEditor.tsx` | 지도 에디터 컴포넌트 |
| `app/template/new/components/MapBlockPreview.tsx` | 지도 블록 프리뷰 컴포넌트 |
| `lib/hooks/useKakaoLoader.ts` | 카카오맵 SDK 로딩 훅 |

### 2. 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/template/new/types.ts` | `MapMarker`, `MapBlockDefault` 타입 추가 |
| `app/template/new/components/DefaultsStep.tsx` | 지도 블록 통합 |
| `package.json` | `react-kakao-maps-sdk` 패키지 추가 |

---

## 주요 기능

### MapBlockEditor (에디터)

1. **장소 검색**: 카카오 장소 검색 API로 장소 찾기
2. **마커 추가**: 검색 결과 선택 또는 지도 클릭으로 마커 추가
3. **마커 편집**: 이름, 주소, 메모, 색상 수정 가능
4. **마커 삭제**: 개별 마커 삭제
5. **마커 목록**: 하단에 저장된 마커 목록 표시

### MapBlockPreview (프리뷰)

1. **지도 표시**: 실제 카카오맵 렌더링
2. **마커 표시**: 현재 선택된 마커와 이름 라벨
3. **슬라이드 기능**: 마커 2개 이상일 때 좌/우 화살표로 탐색
4. **인디케이터**: 하단에 현재 위치 점 표시

---

## 기술적 세부사항

### 타입 정의

```typescript
// 지도 마커 아이템
export interface MapMarker {
  id: string;
  name: string;              // 장소 이름
  address?: string;          // 주소
  lat: number;               // 위도
  lng: number;               // 경도
  color: string;             // 마커 색상
  memo?: string;             // 메모
}

// 지도 블록 기본값 타입
export interface MapBlockDefault {
  markers: MapMarker[];      // 저장된 마커들
  center: {                  // 지도 중심 좌표
    lat: number;
    lng: number;
  };
  level: number;             // 지도 줌 레벨 (1-14)
}
```

### 카카오맵 로더 훅

```typescript
export default function useKakaoLoader() {
  const [loading, error] = useKakaoLoaderOrigin({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '',
    libraries: ['clusterer', 'services'],
  });
  return { loading, error };
}
```

### 무한 루프 방지 패턴

```typescript
// onChange를 ref로 감싸서 useEffect 무한 루프 방지
const onChangeRef = useRef(onChange);
onChangeRef.current = onChange;

useEffect(() => {
  onChangeRef.current({ markers, center, level });
}, [markers, center, level]);
```

### 팝업 위치 계산

```typescript
// 마커 yAnchor 1.3, 높이 64px → 상단이 좌표에서 83px 위
// 팝업 밑면과 마커 맨 위 사이 8px 간격
<div style={{ transform: 'translateY(calc(-100% - 83px - 8px))' }}>
```

---

## UI/UX 개선사항

### 마커 스타일
- 크기: 에디터 64px, 프리뷰 32px
- 그림자: `0 6px 16px rgba(0, 0, 0, 0.45), 0 3px 6px rgba(0, 0, 0, 0.35)`
- 이름 라벨: 마커 아래에 흰색 배경 라벨

### 팝업 스타일
- 마커 중앙 정렬 (`xAnchor: 0.5`)
- 마커 상단에서 8px 간격
- 긴 텍스트 줄바꿈 (`break-words whitespace-pre-wrap`)

### 프리뷰 슬라이드
- 좌/우 화살표 버튼 (`z-index: 10`)
- 하단 인디케이터 점
- 순환 방식 네비게이션

---

## 환경 설정

### 필요한 환경 변수

```
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_javascript_key
```

### 카카오 개발자 설정
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 생성 또는 선택
3. 플랫폼 > Web 사이트 도메인 등록 (예: `http://localhost:3000`)
4. JavaScript 키 복사하여 `.env.local`에 설정

---

## 패키지 의존성

```json
{
  "react-kakao-maps-sdk": "^1.x.x"
}
```

---

## 다음 단계 (향후 작업)

- [ ] 서버/DB 연동으로 마커 영구 저장
- [ ] "요소별 뷰"에서 전체 마커 한 번에 보기
- [ ] 마커 카테고리/태그 기능
- [ ] 마커 클러스터링 (많은 마커 그룹화)

---

## 스크린샷

*추후 추가*
