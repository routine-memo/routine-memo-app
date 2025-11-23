import { useState, useEffect, useRef } from 'react';
import { BlockPosition } from '../types';
import { handleWidthResize, handleHeightResize } from '../resizeHandlers';

interface ResizingBlock {
  blockId: string;
  direction: 'left' | 'right' | 'bottom';
  startX: number;
  startY: number;
  startColSpan: number;
  startHeight: number;
  startColStart: number; // 왼쪽 리사이즈 시 필요
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
    direction: 'left' | 'right' | 'bottom'
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
      startColStart: block.colStart,
    });
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!resizingBlock) return;

    const block = blockPositions.find(b => b.id === resizingBlock.blockId);
    if (!block) return;

    if (resizingBlock.direction === 'right' || resizingBlock.direction === 'left') {
      // 가로 리사이즈: 픽셀 단위 드래그를 열 단위로 변환
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - resizingBlock.startX;

      // 100px 이동마다 1열씩 증가/감소
      const PIXELS_PER_COL = 100;
      const colDelta = Math.floor(delta / PIXELS_PER_COL);

      if (colDelta !== accumulatedDeltaRef.current) {
        let direction: 'increase' | 'decrease';

        if (resizingBlock.direction === 'right') {
          // 오른쪽 리사이즈: 오른쪽으로 드래그 = 증가
          direction = colDelta > accumulatedDeltaRef.current ? 'increase' : 'decrease';
        } else {
          // 왼쪽 리사이즈: 왼쪽으로 드래그 = 증가
          direction = colDelta < accumulatedDeltaRef.current ? 'increase' : 'decrease';
        }

        const result = handleWidthResize(
          block,
          direction,
          blockPositions,
          resizingBlock.direction // 왼쪽/오른쪽 정보 전달
        );
        if (result) {
          setBlockPositions(result);
          accumulatedDeltaRef.current = colDelta;
        }
      }
    } else {
      // 세로 리사이즈: 140px 단위로 행 먹기 (가로와 동일한 방식)
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - resizingBlock.startY;

      // 140px 이동마다 1행씩 증가/감소
      const PIXELS_PER_ROW = 140;
      const rowDelta = Math.floor(delta / PIXELS_PER_ROW);

      if (rowDelta !== accumulatedDeltaRef.current) {
        const direction = rowDelta > accumulatedDeltaRef.current ? 'increase' : 'decrease';
        const result = handleHeightResize(block.id, direction, blockPositions);
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
