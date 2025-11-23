import { BlockPosition, DropTarget } from './types';
import { moveBlockInRow, moveBlockToRow, moveBlockToRowSide } from './blockUtils';

// 드롭 처리 메인 함수
export const handleDrop = (
  draggedBlock: BlockPosition | null,
  dropTarget: DropTarget | null,
  targetBlock: BlockPosition,
  blockPositions: BlockPosition[]
): BlockPosition[] | null => {
  if (!draggedBlock || !dropTarget) return null;
  if (draggedBlock.id === targetBlock.id) return null;

  const { position, secondaryPosition, targetRow } = dropTarget;

  // 위/아래로 드롭
  if (position === 'above' || position === 'below') {
    if (secondaryPosition) {
      return moveBlockToRowSide(blockPositions, draggedBlock, targetBlock, secondaryPosition, targetRow);
    } else {
      return moveBlockToRow(blockPositions, draggedBlock, targetBlock, position);
    }
  }

  // 왼쪽/오른쪽으로 드롭
  if (position === 'left' || position === 'right') {
    // targetRow가 있으면 멀티행 블록의 특정 행에 드롭
    if (targetRow !== undefined) {
      console.log(`📍 멀티행 ${targetRow}행 옆 드롭`);
      return moveBlockToRowSide(blockPositions, draggedBlock, targetBlock, position, targetRow);
    }

    // 같은 행이면 재배치
    if (draggedBlock.row === targetBlock.row) {
      return moveBlockInRow(blockPositions, draggedBlock, targetBlock, position);
    } else {
      // 다른 행이면 타겟 블록 옆에 새로 배치
      return moveBlockToRowSide(blockPositions, draggedBlock, targetBlock, position);
    }
  }

  return null;
};
