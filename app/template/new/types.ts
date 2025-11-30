import { LucideIcon } from 'lucide-react';

export type BlockType =
  | 'timeline'
  | 'text'
  | 'image'
  | 'checklist'
  | 'emotion'
  | 'date'
  | 'weather'
  | 'data'
  | 'chart'
  | 'video'
  | 'link'
  | 'file'
  | 'map';

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

// 블록 타입별 기본값 타입
export type BlockDefaultValue =
  | { type: 'text'; value: TextBlockDefault }
  | { type: 'timeline'; value: unknown }
  | { type: 'image'; value: ImageBlockDefault }
  | { type: 'checklist'; value: ChecklistBlockDefault }
  | { type: 'emotion'; value: EmotionBlockDefault }
  | { type: 'date'; value: unknown }
  | { type: 'weather'; value: WeatherBlockDefault }
  | { type: 'data'; value: unknown }
  | { type: 'chart'; value: unknown }
  | { type: 'video'; value: VideoBlockDefault }
  | { type: 'link'; value: LinkBlockDefault }
  | { type: 'file'; value: unknown }
  | { type: 'map'; value: unknown };

export interface BlockPosition {
  id: string;
  type: BlockType;
  row: number;       // 행 번호 (0부터 시작)
  colStart: number;  // 시작 열 (0-5, 6열 시스템)
  colSpan: number;   // 차지하는 열 개수 (기본 2, 범위: 1-6)
  height: number;    // 블록의 높이 (픽셀, 기본 120)
  defaultValue?: BlockDefaultValue; // 블록의 기본값
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
