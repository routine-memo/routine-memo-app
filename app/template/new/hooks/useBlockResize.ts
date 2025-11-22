import { useState, useEffect } from 'react';
import { BlockPosition } from '../types';
import { handleWidthResize, handleHeightResize } from '../resizeHandlers';

interface ResizingBlock {
  blockId: string;
  direction: 'right' | 'bottom';
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export const useBlockResize = (
  blockPositions: BlockPosition[],
  setBlockPositions: (blocks: BlockPosition[]) => void,
  containerWidth: number
) => {
  const [resizingBlock, setResizingBlock] = useState<ResizingBlock | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    block: BlockPosition,
    direction: 'right' | 'bottom'
  ) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setResizingBlock({
      blockId: block.id,
      direction,
      startX: clientX,
      startY: clientY,
      startWidth: block.width,
      startHeight: block.height,
    });
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!resizingBlock) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const block = blockPositions.find(b => b.id === resizingBlock.blockId);
    if (!block) return;

    if (resizingBlock.direction === 'right') {
      const delta = clientX - resizingBlock.startX;
      const newWidth = Math.max(50, resizingBlock.startWidth + delta);

      const result = handleWidthResize(block, newWidth, blockPositions, containerWidth);
      if (result) {
        setBlockPositions(result);
      }
    } else {
      const delta = clientY - resizingBlock.startY;
      const newHeight = Math.max(60, resizingBlock.startHeight + delta);

      const result = handleHeightResize(block.id, newHeight, blockPositions);
      setBlockPositions(result);
    }
  };

  const handleResizeEnd = () => {
    setResizingBlock(null);
  };

  useEffect(() => {
    if (resizingBlock) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);

      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        window.removeEventListener('touchmove', handleResizeMove);
        window.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [resizingBlock, blockPositions]);

  return {
    handleResizeStart,
    resizingBlock,
  };
};
