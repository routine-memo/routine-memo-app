import { BlockPosition, DropTarget } from './types';

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

  // 세로 위치 판단 (above/below/middle)
  if (y < threshold) {
    position = 'above';
    // above일 때도 좌/우 위치 추가 정보 저장
    secondaryPosition = x < rect.width / 2 ? 'left' : 'right';
  } else if (y > rect.height - threshold) {
    position = 'below';
    // below일 때도 좌/우 위치 추가 정보 저장
    secondaryPosition = x < rect.width / 2 ? 'left' : 'right';
  } else if (x < rect.width / 2) {
    position = 'left';
  } else {
    position = 'right';
  }

  return {
    blockId: targetBlock.id,
    position,
    secondaryPosition
  };
};
