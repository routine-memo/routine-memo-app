import { useState, useEffect, useRef } from 'react';
import { BlockPosition } from '../types';
import { handleWidthResize, handleHeightResize } from '../resizeHandlers';

interface ResizingBlock {
  blockId: string;
  direction: 'right' | 'bottom';
  startX: number;
  startY: number;
  startColSpan: number;
  startHeight: number;
}

export const useBlockResize = (
  blockPositions: BlockPosition[],
  setBlockPositions: (blocks: BlockPosition[]) => void
) => {
  const [resizingBlock, setResizingBlock] = useState<ResizingBlock | null>(null);
  const accumulatedDeltaRef = useRef<number>(0);

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    block: BlockPosition,
    direction: 'right' | 'bottom'
  ) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    accumulatedDeltaRef.current = 0;

    setResizingBlock({
      blockId: block.id,
      direction,
      startX: clientX,
      startY: clientY,
      startColSpan: block.colSpan,
      startHeight: block.height,
    });
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!resizingBlock) return;

    const block = blockPositions.find(b => b.id === resizingBlock.blockId);
    if (!block) return;

    if (resizingBlock.direction === 'right') {
      // 가로 리사이즈: 픽셀 단위 드래그를 열 단위로 변환
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - resizingBlock.startX;

      // 100px 이동마다 1열씩 증가/감소
      const PIXELS_PER_COL = 100;
      const colDelta = Math.floor(delta / PIXELS_PER_COL);

      if (colDelta !== accumulatedDeltaRef.current) {
        const direction = colDelta > accumulatedDeltaRef.current ? 'increase' : 'decrease';
        const result = handleWidthResize(block, direction, blockPositions);
        if (result) {
          setBlockPositions(result);
          accumulatedDeltaRef.current = colDelta;
        }
      }
    } else {
      // 세로 리사이즈: 140px 단위로 행 먹기
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - resizingBlock.startY;

      // 140px 이동마다 1행씩 증가/감소
      const PIXELS_PER_ROW = 140;
      const rowDelta = Math.floor(delta / PIXELS_PER_ROW);

      if (rowDelta !== accumulatedDeltaRef.current) {
        // 새로운 행 개수 계산 (최소 1행)
        const currentRows = Math.ceil(block.height / PIXELS_PER_ROW);
        const newRows = Math.max(1, currentRows + (rowDelta - accumulatedDeltaRef.current));
        const newHeight = newRows * PIXELS_PER_ROW;

        const result = handleHeightResize(block.id, newHeight, blockPositions);
        if (result) {
          setBlockPositions(result);
          accumulatedDeltaRef.current = rowDelta;
        }
      }
    }
  };

  const handleResizeEnd = () => {
    setResizingBlock(null);
    accumulatedDeltaRef.current = 0;
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
