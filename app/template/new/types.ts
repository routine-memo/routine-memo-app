import { LucideIcon } from 'lucide-react';

export type BlockType =
  | 'text'
  | 'image'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'rating'
  | 'time'
  | 'location'
  | 'link'
  | 'todo'
  | 'map';

export type Step = 'name' | 'blocks' | 'notification';

export interface BlockPosition {
  id: string;
  type: BlockType;
  row: number;       // 행 번호
  x: number;         // 행 내에서의 수평 위치 (픽셀, 0부터 시작)
  y: number;         // 행 내에서의 수직 위치 (픽셀, 0부터 시작)
  width: number;     // 블록의 너비 (픽셀)
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
