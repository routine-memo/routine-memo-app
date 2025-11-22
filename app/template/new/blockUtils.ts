import { BlockPosition } from './types';

// 블록 간 충돌 검사 (2D)
export const checkBlockCollision = (
  newBlock: { x: number; y: number; width: number; height: number },
  existingBlock: BlockPosition
): boolean => {
  // 두 블록이 겹치는지 확인
  const horizontalOverlap =
    newBlock.x < existingBlock.x + existingBlock.width &&
    newBlock.x + newBlock.width > existingBlock.x;

  const verticalOverlap =
    newBlock.y < existingBlock.y + existingBlock.height &&
    newBlock.y + newBlock.height > existingBlock.y;

  return horizontalOverlap && verticalOverlap;
};

// 특정 위치에 블록을 배치할 수 있는지 확인 (같은 행 내에서)
export const canPlaceBlock = (
  blocks: BlockPosition[],
  row: number,
  x: number,
  y: number,
  width: number,
  height: number,
  excludeBlockId?: string
): boolean => {
  const rowBlocks = blocks.filter(b => b.row === row && b.id !== excludeBlockId);

  for (const block of rowBlocks) {
    if (checkBlockCollision({ x, y, width, height }, block)) {
      return false;
    }
  }

  return true;
};

// 레이아웃 재정렬: 세로 스택의 빈 공간만 제거 (가로 배치는 건드리지 않음)
export const compactLayout = (blocks: BlockPosition[]): BlockPosition[] => {
  let compactedBlocks = [...blocks];

  // 행별로 처리
  const rows = [...new Set(blocks.map(b => b.row))].sort((a, b) => a - b);

  rows.forEach(row => {
    const rowBlocks = compactedBlocks.filter(b => b.row === row);

    // y=0인 블록들의 (x, width) 조합을 찾기 (가로 배치된 블록들)
    const baseBlocks = rowBlocks.filter(b => b.y === 0);

    // 각 가로 블록 아래의 세로 스택 압축
    baseBlocks.forEach(baseBlock => {
      // 같은 x, width를 가진 블록들 찾기 (세로 스택)
      const stackBlocks = rowBlocks
        .filter(b => b.x === baseBlock.x && b.width === baseBlock.width)
        .sort((a, b) => a.y - b.y);

      // 세로 스택이 2개 이상일 때만 압축
      if (stackBlocks.length > 1) {
        let currentY = 0;

        stackBlocks.forEach(block => {
          compactedBlocks = compactedBlocks.map(b => {
            if (b.id === block.id) {
              const updated = { ...b, y: currentY };
              currentY += b.height + 12;
              return updated;
            }
            return b;
          });
        });
      }
    });
  });

  return compactedBlocks;
};

// 전체 행 배열 생성
export const getAllRows = (blockPositions: BlockPosition[]): number[] => {
  if (blockPositions.length === 0) return [];
  const maxRow = Math.max(...blockPositions.map(b => b.row));
  return Array.from({ length: maxRow + 1 }, (_, i) => i);
};

// 특정 행의 블록들 가져오기
export const getBlocksByRow = (blockPositions: BlockPosition[], row: number): BlockPosition[] => {
  return blockPositions.filter(b => b.row === row);
};
