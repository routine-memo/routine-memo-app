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

// 블록 타입별 기본값 타입
export type BlockDefaultValue =
  | { type: 'text'; value: TextBlockDefault }
  | { type: 'timeline'; value: unknown }
  | { type: 'image'; value: unknown }
  | { type: 'checklist'; value: ChecklistBlockDefault }
  | { type: 'emotion'; value: unknown }
  | { type: 'date'; value: unknown }
  | { type: 'weather'; value: unknown }
  | { type: 'data'; value: unknown }
  | { type: 'chart'; value: unknown }
  | { type: 'video'; value: unknown }
  | { type: 'link'; value: unknown }
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
