import { LucideIcon } from 'lucide-react';

export type BlockType =
  | 'timeline'
  | 'text'
  | 'image'
  | 'checklist'
  | 'emotion'
  | 'date'
  | 'weather'
  | 'dataGraph'
  | 'video'
  | 'link'
  | 'file'
  | 'map'
  | 'progress';

export type Step = 'name' | 'blocks' | 'defaults' | 'notification';

// 텍스트 블록 기본값 타입
export interface TextBlockDefault {
  richText: string;  // Tiptap HTML 콘텐츠
  sketchData: string; // react-sketch-canvas 데이터 (JSON 문자열)
}

// 체크리스트 블록 기본값 타입
export interface ChecklistBlockDefault {
  html: string;  // Tiptap TaskList HTML 콘텐츠
}

// 날씨 타입
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'typhoon' | 'dusty' | 'cold' | 'hot';

// 날씨 블록 기본값 타입
export interface WeatherBlockDefault {
  weather: WeatherType | null;  // 선택된 날씨
}

// 감정 타입
export type EmotionType =
  // 긍정적 감정
  | 'happy' | 'joyful' | 'glad' | 'interested' | 'passionate'
  | 'fun' | 'hopeful' | 'comfortable' | 'excited' | 'pleasant'
  // 부정적 감정
  | 'sad' | 'angry' | 'surprised' | 'fearful' | 'depressed'
  | 'anxious' | 'unpleasant' | 'embarrassed' | 'regretful';

// 감정 블록 기본값 타입
export interface EmotionBlockDefault {
  emotion: EmotionType | null;  // 선택된 감정
}

// 이미지 블록 기본값 타입
export interface ImageBlockDefault {
  images: string[];  // base64 인코딩된 이미지 배열
}

// 영상 블록 기본값 타입
export interface VideoBlockDefault {
  videos: string[];  // base64 인코딩된 영상 배열
}

// 링크 표시 모드
export type LinkDisplayMode = 'embed' | 'preview';

// 링크 메타데이터
export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

// 개별 링크 아이템
export interface LinkItem {
  url: string;
  displayMode: LinkDisplayMode;
  metadata?: LinkMetadata;
}

// 링크 블록 기본값 타입 (다중 링크 지원)
export interface LinkBlockDefault {
  links: LinkItem[];
}

// 파일 아이템
export interface FileItem {
  name: string;       // 파일명
  size: number;       // 파일 크기 (bytes)
  type: string;       // MIME 타입
  data: string;       // base64 인코딩된 파일 데이터
  lastModified?: number; // 수정 시간
}

// 파일 블록 기본값 타입
export interface FileBlockDefault {
  files: FileItem[];
}

// 날짜 블록 기본값 타입
export interface DateBlockDefault {
  date: string | null;  // ISO 8601 형식 (YYYY-MM-DD)
}

// 타임라인 행별 열 범위
export interface TimelineRowSpan {
  hour: number;         // 시간 (6-23)
  startCol: number;     // 시작 열 (0-4, 0=:00, 1=:15, 2=:30, 3=:45, 4=:60)
  endCol: number;       // 끝 열 (1-5, 배타적)
}

// 타임라인 일정 아이템
export interface TimelineItem {
  id: string;
  title: string;
  rows: TimelineRowSpan[];  // 행별 열 범위 배열
  color: string;            // 일정 색상
}

// 타임라인 블록 기본값 타입
export interface TimelineBlockDefault {
  items: TimelineItem[];
}

// 데이터 그래프 표시 서식
export type DataGraphFormat = 'number' | 'percent';

// 데이터 그래프 항목 정의
export interface DataGraphField {
  id: string;
  name: string;           // 항목 이름 (예: "턱걸이 갯수", "체중")
  format: DataGraphFormat; // 표시 서식 (숫자 또는 퍼센트)
  color: string;          // 그래프 선 색상
}

// 데이터 그래프 값 (fieldId -> 값)
export interface DataGraphValue {
  fieldId: string;
  value: number;
}

// 데이터 그래프 블록 기본값 타입
export interface DataGraphBlockDefault {
  fields: DataGraphField[];        // 추적할 항목들 정의
  values?: DataGraphValue[];       // 각 항목의 입력값 (기록 입력 시 사용)
}

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
  level: number;             // 지도 줌 레벨 (1-14, 작을수록 확대)
}

// 달성도 측정 모드
export type ProgressMode = 'dday' | 'percent';

// 달성도 블록 기본값 타입
export interface ProgressBlockDefault {
  mode: ProgressMode;        // 측정 모드 (D-Day 또는 %)
  title: string;             // 목표 제목
  // D-Day 모드
  targetDate?: string;       // 목표 날짜 (ISO 8601, YYYY-MM-DD)
  savedDDay?: number;        // 저장 시점의 D-Day 값 (기록 조회 시 변경되지 않도록)
  // % 모드
  currentValue?: number;     // 현재 값
  targetValue?: number;      // 목표 값
}

// 블록 타입별 기본값 타입
export type BlockDefaultValue =
  | { type: 'text'; value: TextBlockDefault }
  | { type: 'timeline'; value: TimelineBlockDefault }
  | { type: 'image'; value: ImageBlockDefault }
  | { type: 'checklist'; value: ChecklistBlockDefault }
  | { type: 'emotion'; value: EmotionBlockDefault }
  | { type: 'date'; value: DateBlockDefault }
  | { type: 'weather'; value: WeatherBlockDefault }
  | { type: 'dataGraph'; value: DataGraphBlockDefault }
  | { type: 'video'; value: VideoBlockDefault }
  | { type: 'link'; value: LinkBlockDefault }
  | { type: 'file'; value: FileBlockDefault }
  | { type: 'map'; value: MapBlockDefault }
  | { type: 'progress'; value: ProgressBlockDefault };

export interface BlockPosition {
  id: string;
  type: BlockType;
  row: number;       // 행 번호 (0부터 시작)
  colStart: number;  // 시작 열 (0-5, 6열 시스템)
  colSpan: number;   // 차지하는 열 개수 (기본 2, 범위: 1-6)
  height: number;    // 블록의 높이 (픽셀, 기본 120)
  defaultValue?: BlockDefaultValue; // 블록의 기본값
  customLabel?: string; // 사용자 정의 블록 이름
}

export interface BlockPaletteItem {
  type: BlockType;
  label: string;
  icon: string;
}

export interface DropTarget {
  blockId: string;
  position: 'above' | 'below' | 'left' | 'right';
  secondaryPosition?: 'left' | 'right'; // above/below 드롭 시 좌/우 위치 정보
  targetRow?: number; // 멀티행 블록의 경우 어느 행에 드롭하는지
}

export interface IconMap {
  [key: string]: LucideIcon;
}
