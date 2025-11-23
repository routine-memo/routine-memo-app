import { BlockPosition } from '../types';
import { ROW_HEIGHT, ROW_GAP, GRID_COLS } from './constants';

// 블록 높이로부터 차지하는 행 수 계산
export const calculateRows = (height: number): number => {
  return Math.ceil((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP));
};

// 행의 총 열 개수 계산
export const getTotalColSpan = (blocks: BlockPosition[]): number => {
  return blocks.reduce((sum, block) => sum + block.colSpan, 0);
};

// 행의 최대 높이 구하기
export const getRowMaxHeight = (blocks: BlockPosition[]): number => {
  if (blocks.length === 0) return 120; // 기본 높이
  return Math.max(...blocks.map(b => b.height), 120);
};

// 전체 행 배열 생성 (블록이 차지하는 모든 행 포함)
export const getAllRows = (blockPositions: BlockPosition[]): number[] => {
  if (blockPositions.length === 0) return [];

  // 각 블록이 차지하는 마지막 행 계산
  const maxRow = Math.max(...blockPositions.map(b => {
    const rows = calculateRows(b.height || ROW_HEIGHT);
    return b.row + rows - 1;
  }));

  return Array.from({ length: maxRow + 1 }, (_, i) => i);
};
