import { BlockPosition, BlockType } from './types';
import { getRowBlocks, getTotalColSpan, calculateRows } from './blockUtils';

const GRID_COLS = 6; // 전체 열 개수
const DEFAULT_COL_SPAN = 2; // 기본 블록 크기 (3단 레이아웃)
const ROW_HEIGHT = 120; // 각 행의 높이

// 블록 추가
export const createBlock = (
  type: BlockType,
  blockPositions: BlockPosition[]
): BlockPosition => {
  // 블록들이 실제로 차지하는 마지막 행 계산 (여러 행을 차지하는 블록 고려)
  const maxRow = blockPositions.length > 0
    ? Math.max(...blockPositions.map(b => {
        const blockRows = calculateRows(b.height || ROW_HEIGHT);
        return b.row + blockRows - 1; // 블록이 차지하는 마지막 행
      }))
    : -1;

  console.log('🆕 새 블록 생성:', {
    existingBlocks: blockPositions.length,
    maxOccupiedRow: maxRow,
    newBlockRow: maxRow + 1
  });

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

  // 삭제된 블록이 차지했던 행 수 계산
  const removedBlockRows = calculateRows(blockToRemove.height || ROW_HEIGHT);
  const removedBlockLastRow = blockToRemove.row + removedBlockRows - 1;

  console.log('🗑️ 블록 삭제:', {
    id: blockToRemove.id,
    startRow: blockToRemove.row,
    rows: removedBlockRows,
    lastRow: removedBlockLastRow
  });

  // 삭제된 블록의 시작 행에 다른 블록이 있는지 확인
  const rowBlocks = getRowBlocks(updatedBlocks, blockToRemove.row);

  if (rowBlocks.length === 0) {
    // 삭제된 블록의 행이 비었으면 아래 행들을 삭제된 블록이 차지했던 행 수만큼 올림
    updatedBlocks = updatedBlocks.map(block => {
      // 삭제된 블록보다 아래에 있는 블록들만 올림
      if (block.row > removedBlockLastRow) {
        return { ...block, row: block.row - removedBlockRows };
      }
      return block;
    });

    console.log(`📍 빈 행 ${removedBlockRows}개 제거, 아래 블록들 ${removedBlockRows}칸 올림`);
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
