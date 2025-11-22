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

  if (y < threshold) {
    position = 'above';
  } else if (y > rect.height - threshold) {
    position = 'below';
  } else if (x < rect.width / 2) {
    position = 'left';
  } else {
    position = 'right';
  }

  return { blockId: targetBlock.id, position };
};
