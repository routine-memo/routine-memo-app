import { BlockPosition, DropTarget } from './types';
import { moveBlockInRow, moveBlockToRow, moveBlockToRowSide } from './blockUtils';

// 드롭 처리 메인 함수
export const handleDrop = (
  draggedBlock: BlockPosition | null,
  dropTarget: DropTarget | null,
  targetBlock: BlockPosition,
  blockPositions: BlockPosition[]
): BlockPosition[] | null => {
  console.log('🔵 handleDrop 호출:', {
    draggedBlock: draggedBlock?.id,
    targetBlock: targetBlock.id,
    position: dropTarget?.position,
    draggedRow: draggedBlock?.row,
    targetRow: targetBlock.row
  });

  if (!draggedBlock || !dropTarget) {
    console.log('❌ draggedBlock 또는 dropTarget 없음');
    return null;
  }
  if (draggedBlock.id === targetBlock.id) {
    console.log('❌ 같은 블록');
    return null;
  }

  const { position } = dropTarget;

  // 위/아래로 드롭: 새로운 행 생성 (타겟 블록과 같은 열 위치/크기)
  if (position === 'above' || position === 'below') {
    console.log('⬆️⬇️ 새 행 생성:', position);
    const result = moveBlockToRow(blockPositions, draggedBlock, targetBlock, position);
    console.log('✅ 결과:', result?.length, '개 블록');
    return result;
  }

  // 왼쪽/오른쪽으로 드롭
  if (position === 'left' || position === 'right') {
    // 같은 행이면 재배치
    if (draggedBlock.row === targetBlock.row) {
      console.log('⬅️➡️ 같은 행 내 재배치:', position);
      const result = moveBlockInRow(blockPositions, draggedBlock, targetBlock, position);
      console.log('✅ 결과:', result?.length, '개 블록');
      return result;
    } else {
      // 다른 행이면 타겟 블록 옆에 새로 배치
      console.log('⬅️➡️ 다른 행 블록 옆에 배치:', position);
      const result = moveBlockToRowSide(blockPositions, draggedBlock, targetBlock, position);
      console.log('✅ 결과:', result?.length, '개 블록');
      return result;
    }
  }

  console.log('❌ 알 수 없는 position:', position);
  return null;
};
