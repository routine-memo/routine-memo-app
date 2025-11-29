import { BlockPosition, BlockType } from './types';
import { calculateRows } from './blockUtils';

const GRID_COLS = 6;
const ROW_HEIGHT = 120;

// 블록 추가
export const createBlock = (
  type: BlockType,
  blockPositions: BlockPosition[]
): BlockPosition => {
  // 블록들이 실제로 차지하는 마지막 행 계산
  const maxRow = blockPositions.length > 0
    ? Math.max(...blockPositions.map(b => {
        const blockRows = calculateRows(b.height || ROW_HEIGHT);
        return b.row + blockRows - 1;
      }))
    : -1;

  return {
    id: `block-${Date.now()}`,
    type,
    row: maxRow + 1,
    colStart: 0,
    colSpan: GRID_COLS,
    height: ROW_HEIGHT,
  };
};

// 블록 삭제 (react-grid-layout이 레이아웃 관리)
export const deleteBlock = (
  id: string,
  blockPositions: BlockPosition[]
): BlockPosition[] => {
  return blockPositions.filter(b => b.id !== id);
};
