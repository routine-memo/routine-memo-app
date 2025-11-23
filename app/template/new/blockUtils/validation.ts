import { BlockPosition } from '../types';
import { getTotalColSpan } from './calculations';
import { GRID_COLS } from './constants';

// 행이 유효한지 검증 (총 열 개수가 GRID_COLS와 일치하는지)
export const isRowValid = (blocks: BlockPosition[]): boolean => {
  const total = getTotalColSpan(blocks);
  return total === GRID_COLS;
};

// 특정 위치에 블록을 배치할 수 있는지 확인
export const canPlaceBlockAt = (
  blocks: BlockPosition[],
  row: number,
  colStart: number,
  colSpan: number,
  excludeBlockId?: string
): boolean => {
  const rowBlocks = blocks.filter(b => b.row === row && b.id !== excludeBlockId);

  // 열 범위가 유효한지 확인
  if (colStart < 0 || colStart + colSpan > GRID_COLS) {
    return false;
  }

  // 다른 블록과 겹치는지 확인
  const colEnd = colStart + colSpan;
  for (const block of rowBlocks) {
    const blockEnd = block.colStart + block.colSpan;
    // 겹침 체크: [colStart, colEnd)와 [block.colStart, blockEnd)가 겹치는지
    if (colStart < blockEnd && colEnd > block.colStart) {
      return false;
    }
  }

  return true;
};
