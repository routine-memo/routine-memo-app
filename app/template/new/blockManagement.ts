import { BlockPosition, BlockType } from './types';

// 블록 추가
export const createBlock = (
  type: BlockType,
  blockPositions: BlockPosition[],
  containerWidth: number
): BlockPosition => {
  const maxRow = blockPositions.length > 0 ? Math.max(...blockPositions.map(b => b.row)) : -1;
  return {
    id: `block-${Date.now()}`,
    type,
    row: maxRow + 1,
    x: 0,
    y: 0,
    width: containerWidth,
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

  // 삭제된 블록의 행에 다른 블록이 없으면 아래 행들을 올림
  const rowBlocks = updatedBlocks.filter(b => b.row === blockToRemove.row);
  if (rowBlocks.length === 0) {
    updatedBlocks = updatedBlocks.map(block => {
      if (block.row > blockToRemove.row) {
        return { ...block, row: block.row - 1 };
      }
      return block;
    });
  }

  return updatedBlocks;
};
