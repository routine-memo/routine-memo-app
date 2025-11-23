import { BlockPosition, DropTarget } from './types';
import { calculateRows } from './blockUtils';

const ROW_HEIGHT = 120;
const ROW_GAP = 12;

export const calculateDropPosition = (
  e: React.DragEvent,
  targetBlock: BlockPosition,
  draggedBlock: BlockPosition | null
): DropTarget | null => {
  if (!draggedBlock || draggedBlock.id === targetBlock.id) return null;

  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const threshold = 30;
  let position: DropTarget['position'];
  let secondaryPosition: 'left' | 'right' | undefined;
  let targetRow: number | undefined;

  // 멀티행 블록인지 먼저 확인
  const blockRows = calculateRows(targetBlock.height || ROW_HEIGHT);
  const isMultiRow = blockRows > 1;

  console.log(`드롭 대상: height=${targetBlock.height}px, blockRows=${blockRows}, isMultiRow=${isMultiRow}`);

  // 멀티행 블록의 경우, 각 행별로 개별 처리
  if (isMultiRow) {
    // 각 행의 높이 + gap 계산
    const rowWithGapHeight = ROW_HEIGHT + ROW_GAP;
    const relativeRow = Math.floor(y / rowWithGapHeight);
    // 블록이 차지하는 행 범위 내로 제한
    const currentRelativeRow = Math.min(relativeRow, blockRows - 1);
    targetRow = targetBlock.row + currentRelativeRow;

    // 현재 행 내에서의 상대적 Y 위치 계산
    const yInCurrentRow = y - (currentRelativeRow * rowWithGapHeight);

    console.log(`🎯 멀티행 블록 (${blockRows}행) - Y위치:${y.toFixed(0)}px → 행:${currentRelativeRow} → targetRow:${targetRow}`);

    // 첫 번째 행의 상단 threshold
    if (currentRelativeRow === 0 && yInCurrentRow < threshold) {
      position = 'above';
      targetRow = undefined; // above/below는 targetRow 불필요
    }
    // 마지막 행의 하단 threshold
    else if (currentRelativeRow === blockRows - 1 && yInCurrentRow > ROW_HEIGHT - threshold) {
      position = 'below';
      targetRow = undefined; // above/below는 targetRow 불필요
    }
    // 각 행의 좌/우 영역
    else {
      position = x < rect.width / 2 ? 'left' : 'right';
    }
  } else {
    // 단일행 블록의 경우 기존 로직 사용
    if (y < threshold) {
      position = 'above';
    } else if (y > rect.height - threshold) {
      position = 'below';
    } else {
      position = x < rect.width / 2 ? 'left' : 'right';
    }
  }

  return {
    blockId: targetBlock.id,
    position,
    secondaryPosition,
    targetRow
  };
};
