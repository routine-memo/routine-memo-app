import { BlockPosition, BlockType } from './types';
import { calculateRows, getBlocksOccupyingRow, redistributeAfterRemoval } from './blockUtils';

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

  const removedBlockRows = calculateRows(blockToRemove.height || ROW_HEIGHT);
  const isMultiRow = removedBlockRows > 1;

  console.log('🗑️ 블록 삭제:', {
    id: blockToRemove.id,
    startRow: blockToRemove.row,
    rows: removedBlockRows,
    isMultiRow
  });

  // 블록 제거
  let updatedBlocks = blockPositions.filter(b => b.id !== id);

  // 해당 행을 차지하는 남은 블록 확인
  const occupyingBlocks = getBlocksOccupyingRow(updatedBlocks, blockToRemove.row);

  if (occupyingBlocks.length === 0) {
    // 행이 완전히 비었으면 아래 행들을 올림
    console.log(`📍 빈 행 ${blockToRemove.row} 제거, 아래 블록들 올림`);
    updatedBlocks = updatedBlocks.map(block => {
      if (block.row > blockToRemove.row) {
        return { ...block, row: block.row - removedBlockRows };
      }
      return block;
    });
  } else {
    // 연결된 블록들 재정렬 (열 겹침 고려)
    console.log(`🔄 블록 삭제 - 연결된 블록들 재정렬 (열 겹침 고려)`);
    updatedBlocks = redistributeAfterRemoval(updatedBlocks, blockToRemove.row);
  }

  return updatedBlocks;
};
