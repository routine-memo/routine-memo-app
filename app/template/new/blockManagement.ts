import { BlockPosition, BlockType } from './types';
import { getRowBlocks, getTotalColSpan } from './blockUtils';

const GRID_COLS = 6; // 전체 열 개수
const DEFAULT_COL_SPAN = 2; // 기본 블록 크기 (3단 레이아웃)

// 블록 추가
export const createBlock = (
  type: BlockType,
  blockPositions: BlockPosition[]
): BlockPosition => {
  const maxRow = blockPositions.length > 0 ? Math.max(...blockPositions.map(b => b.row)) : -1;
  return {
    id: `block-${Date.now()}`,
    type,
    row: maxRow + 1,
    colStart: 0,
    colSpan: GRID_COLS, // 새 행은 전체 너비로 시작
    height: 120,
  };
};

// 블록 삭제
export const deleteBlock = (
  id: string,
  blockPositions: BlockPosition[]
): BlockPosition[] => {
  const blockToRemove = blockPositions.find(b => b.id === id);
  if (!blockToRemove) return blockPositions;

  let updatedBlocks = blockPositions.filter(b => b.id !== id);

  // 삭제된 블록의 행에 다른 블록이 있는지 확인
  const rowBlocks = getRowBlocks(updatedBlocks, blockToRemove.row);

  if (rowBlocks.length === 0) {
    // 행이 비었으면 아래 행들을 한 칸씩 올림
    updatedBlocks = updatedBlocks.map(block => {
      if (block.row > blockToRemove.row) {
        return { ...block, row: block.row - 1 };
      }
      return block;
    });
  } else {
    // 같은 행에 블록이 남아있으면 남은 블록들을 재정렬
    const totalSpan = getTotalColSpan(rowBlocks);

    if (totalSpan < GRID_COLS) {
      // 행이 꽉 차지 않으면 남은 블록들을 확장
      const extraCols = GRID_COLS - totalSpan;
      const blocksToExpand = rowBlocks.length;
      const colsPerBlock = Math.floor(extraCols / blocksToExpand);
      const remainder = extraCols % blocksToExpand;

      updatedBlocks = updatedBlocks.map(block => {
        if (block.row !== blockToRemove.row) return block;

        const blockIndex = rowBlocks.findIndex(b => b.id === block.id);
        const extraSpan = colsPerBlock + (blockIndex < remainder ? 1 : 0);

        // colStart 재계산
        let newColStart = 0;
        for (let i = 0; i < blockIndex; i++) {
          const prevBlock = rowBlocks[i];
          const prevExtra = colsPerBlock + (i < remainder ? 1 : 0);
          newColStart += prevBlock.colSpan + prevExtra;
        }

        return {
          ...block,
          colStart: newColStart,
          colSpan: block.colSpan + extraSpan
        };
      });
    }
  }

  return updatedBlocks;
};
