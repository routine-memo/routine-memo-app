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

export type Step = 'name' | 'blocks' | 'notification';

export interface BlockPosition {
  id: string;
  type: BlockType;
  row: number;       // 행 번호 (0부터 시작)
  colStart: number;  // 시작 열 (0-5, 6열 시스템)
  colSpan: number;   // 차지하는 열 개수 (기본 2, 범위: 1-6)
  height: number;    // 블록의 높이 (픽셀, 기본 120)
}

export interface BlockPaletteItem {
  type: BlockType;
  label: string;
  icon: string;
}

export interface DropTarget {
  blockId: string;
  position: 'above' | 'below' | 'left' | 'right';
}

export interface IconMap {
  [key: string]: LucideIcon;
}
