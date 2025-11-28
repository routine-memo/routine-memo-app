import { BlockPosition } from '../types';
import { getBlocksOccupyingRow } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';

/**
 * 재정렬 후 각 블록이 확장 가능한 빈 공간을 채우는 로직
 *
 * @param blocks 블록 배열
 * @param protectedBlocks 보호할 블록 ID들 (확장 대상에서 제외)
 */
export const expandBlocksToFillGaps = (
  blocks: BlockPosition[],
  protectedBlocks?: Set<string>
): BlockPosition[] => {
  // 모든 행 수집
  const allRows = new Set<number>();
  blocks.forEach(block => {
    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    for (let i = 0; i < blockRows; i++) {
      allRows.add(block.row + i);
    }
  });

  // 각 블록의 최종 위치를 저장
  const blockPositions = new Map<string, { colStart: number; colSpan: number }>();

  blocks.forEach(block => {
    blockPositions.set(block.id, {
      colStart: block.colStart,
      colSpan: block.colSpan
    });
  });

  // 각 행마다 확장 가능한 블록 찾기
  for (const row of Array.from(allRows).sort((a, b) => a - b)) {
    const occupyingBlocks = getBlocksOccupyingRow(blocks, row);

    if (occupyingBlocks.length === 0) {
      continue;
    }

    // colStart 순으로 정렬
    const sortedBlocks = occupyingBlocks
      .map(block => ({
        block,
        colStart: blockPositions.get(block.id)!.colStart,
        colSpan: blockPositions.get(block.id)!.colSpan
      }))
      .sort((a, b) => a.colStart - b.colStart);

    // 각 블록마다 확장 가능한지 체크
    for (let i = 0; i < sortedBlocks.length; i++) {
      const current = sortedBlocks[i];
      const currentColEnd = current.colStart + current.colSpan;

      // 보호된 블록은 확장하지 않음
      if (protectedBlocks?.has(current.block.id)) {
        continue;
      }

      // 왼쪽 확장 가능 여부
      if (i === 0 && current.colStart > 0) {
        const leftGap = current.colStart;

        if (canExpandLeft(blocks, current.block, leftGap, blockPositions, protectedBlocks)) {
          blockPositions.set(current.block.id, {
            colStart: 0,
            colSpan: current.colSpan + leftGap
          });
          current.colStart = 0;
          current.colSpan = current.colSpan + leftGap;
        }
      }

      // 오른쪽 확장 가능 여부
      const nextBlock = i < sortedBlocks.length - 1 ? sortedBlocks[i + 1] : null;
      const nextColStart = nextBlock ? nextBlock.colStart : GRID_COLS;
      const rightGap = nextColStart - currentColEnd;

      if (rightGap > 0) {
        if (canExpandRight(blocks, current.block, rightGap, blockPositions, protectedBlocks)) {
          const currentPos = blockPositions.get(current.block.id)!;
          blockPositions.set(current.block.id, {
            colStart: currentPos.colStart,
            colSpan: currentPos.colSpan + rightGap
          });
          current.colSpan = current.colSpan + rightGap;
        }
      }
    }
  }

  // 최종 결과 적용
  const result = blocks.map(block => {
    const position = blockPositions.get(block.id)!;
    return {
      ...block,
      colStart: position.colStart,
      colSpan: position.colSpan
    };
  });

  return result;
};

/**
 * 블록이 왼쪽으로 확장 가능한지 확인
 */
const canExpandLeft = (
  allBlocks: BlockPosition[],
  targetBlock: BlockPosition,
  expandAmount: number,
  blockPositions: Map<string, { colStart: number; colSpan: number }>,
  _protectedBlocks?: Set<string>
): boolean => {
  const targetRows = calculateRows(targetBlock.height || ROW_HEIGHT);
  const targetPos = blockPositions.get(targetBlock.id)!;
  const newColStart = targetPos.colStart - expandAmount;

  if (newColStart < 0) {
    return false;
  }

  for (let i = 0; i < targetRows; i++) {
    const checkRow = targetBlock.row + i;
    const occupyingBlocks = getBlocksOccupyingRow(allBlocks, checkRow);

    for (const block of occupyingBlocks) {
      if (block.id === targetBlock.id) continue;

      const blockPos = blockPositions.get(block.id)!;
      const blockColEnd = blockPos.colStart + blockPos.colSpan;

      if (blockColEnd > newColStart && blockPos.colStart < targetPos.colStart) {
        return false;
      }
    }
  }

  return true;
};

/**
 * 블록이 오른쪽으로 확장 가능한지 확인
 */
const canExpandRight = (
  allBlocks: BlockPosition[],
  targetBlock: BlockPosition,
  expandAmount: number,
  blockPositions: Map<string, { colStart: number; colSpan: number }>,
  _protectedBlocks?: Set<string>
): boolean => {
  const targetRows = calculateRows(targetBlock.height || ROW_HEIGHT);
  const targetPos = blockPositions.get(targetBlock.id)!;
  const currentColEnd = targetPos.colStart + targetPos.colSpan;
  const newColEnd = currentColEnd + expandAmount;

  if (newColEnd > GRID_COLS) {
    return false;
  }

  for (let i = 0; i < targetRows; i++) {
    const checkRow = targetBlock.row + i;
    const occupyingBlocks = getBlocksOccupyingRow(allBlocks, checkRow);

    for (const block of occupyingBlocks) {
      if (block.id === targetBlock.id) continue;

      const blockPos = blockPositions.get(block.id)!;

      if (blockPos.colStart < newColEnd && blockPos.colStart >= currentColEnd) {
        return false;
      }
    }
  }

  return true;
};
