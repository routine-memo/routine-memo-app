import { useState, useRef } from 'react';
import { BlockPosition } from '../types';

export const useTouchDrag = (
  blockPositions: BlockPosition[],
  setBlockPositions: (blocks: BlockPosition[]) => void
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<BlockPosition | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent, block: BlockPosition) => {
    console.log('[TouchDrag] Touch start', { blockId: block.id });
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // 터치 시작 위치와 블록의 현재 위치 차이 저장
    dragOffset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    setDraggedBlock(block);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedBlock || !isDragging) return;

    console.log('[TouchDrag] Touch move');
    e.preventDefault();

    const touch = e.touches[0];
    const container = document.getElementById('blocks-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // 컨테이너 기준 새 위치 계산
    const newX = touch.clientX - containerRect.left - dragOffset.current.x;
    const newY = touch.clientY - containerRect.top - dragOffset.current.y;

    // 블록 위치 업데이트
    const updatedBlocks = blockPositions.map(b =>
      b.id === draggedBlock.id
        ? { ...b, x: Math.max(0, newX), y: Math.max(0, newY) }
        : b
    );

    setBlockPositions(updatedBlocks);
  };

  const handleTouchEnd = () => {
    console.log('[TouchDrag] Touch end');
    setIsDragging(false);
    setDraggedBlock(null);
  };

  return {
    isDragging,
    draggedBlock,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
