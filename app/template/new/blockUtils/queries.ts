import { BlockPosition } from '../types';
import { calculateRows } from './calculations';
import { ROW_HEIGHT } from './constants';

// 특정 행의 블록들 가져오기 (해당 행에서 시작하는 블록만)
export const getRowBlocks = (blockPositions: BlockPosition[], row: number): BlockPosition[] => {
  return blockPositions
    .filter(b => b.row === row)
    .sort((a, b) => a.colStart - b.colStart);
};

// 특정 행을 차지하고 있는 모든 블록 가져오기 (위 행에서 시작해서 여러 행을 차지하는 블록 포함)
export const getBlocksOccupyingRow = (blockPositions: BlockPosition[], row: number): BlockPosition[] => {
  return blockPositions.filter(b => {
    const blockRows = calculateRows(b.height || ROW_HEIGHT);
    const blockEndRow = b.row + blockRows - 1;
    // 블록이 시작하는 행 <= row <= 블록이 끝나는 행
    return b.row <= row && row <= blockEndRow;
  }).sort((a, b) => a.colStart - b.colStart);
};
