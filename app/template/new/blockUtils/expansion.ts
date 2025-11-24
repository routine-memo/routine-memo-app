import { BlockPosition } from '../types';
import { getBlocksOccupyingRow } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';

/**
 * 재정렬 후 각 블록이 확장 가능한 빈 공간을 채우는 로직
 *
 * 각 행마다:
 * 1. 블록들을 colStart 순으로 정렬
 * 2. 블록들 사이의 빈 공간 감지
 * 3. 왼쪽/오른쪽 블록이 확장 가능한지 확인
 * 4. 확장
 */
export const expandBlocksToFillGaps = (blocks: BlockPosition[]): BlockPosition[] => {
  console.log('\n🔍 빈 공간 채우기 시작');

  // 모든 행 수집
  const allRows = new Set<number>();
  blocks.forEach(block => {
    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    for (let i = 0; i < blockRows; i++) {
      allRows.add(block.row + i);
    }
  });

  console.log(`  전체 행: ${allRows.size}개`, Array.from(allRows).sort((a, b) => a - b));

  // 각 블록의 최종 위치를 저장 (blockId -> { colStart, colSpan })
  const blockPositions = new Map<string, { colStart: number; colSpan: number }>();

  // 초기 위치 설정
  blocks.forEach(block => {
    blockPositions.set(block.id, {
      colStart: block.colStart,
      colSpan: block.colSpan
    });
  });

  // 각 행마다 확장 가능한 블록 찾기
  for (const row of Array.from(allRows).sort((a, b) => a - b)) {
    console.log(`\n  행 ${row} 처리 중...`);

    // 이 행을 차지하는 블록들
    const occupyingBlocks = getBlocksOccupyingRow(blocks, row);

    if (occupyingBlocks.length === 0) {
      console.log(`    블록 없음, 스킵`);
      continue;
    }

    // colStart 순으로 정렬하되, 현재 blockPositions의 값을 사용
    const sortedBlocks = occupyingBlocks
      .map(block => ({
        block,
        colStart: blockPositions.get(block.id)!.colStart,
        colSpan: blockPositions.get(block.id)!.colSpan
      }))
      .sort((a, b) => a.colStart - b.colStart);

    console.log(`    블록 순서:`, sortedBlocks.map(b => ({
      id: b.block.id,
      colStart: b.colStart,
      colSpan: b.colSpan,
      colEnd: b.colStart + b.colSpan
    })));

    // 각 블록마다 확장 가능한지 체크
    for (let i = 0; i < sortedBlocks.length; i++) {
      const current = sortedBlocks[i];
      const currentColEnd = current.colStart + current.colSpan;

      // 왼쪽 확장 가능 여부 (첫 블록이고 colStart > 0)
      if (i === 0 && current.colStart > 0) {
        const leftGap = current.colStart;
        console.log(`    블록 ${current.block.id}: 왼쪽 ${leftGap}열 확장 가능`);

        // 이 블록이 다른 행에서도 왼쪽으로 확장 가능한지 확인
        if (canExpandLeft(blocks, current.block, leftGap, blockPositions)) {
          console.log(`      ✅ 왼쪽 확장 실행`);
          blockPositions.set(current.block.id, {
            colStart: 0,
            colSpan: current.colSpan + leftGap
          });
          // sortedBlocks 업데이트
          current.colStart = 0;
          current.colSpan = current.colSpan + leftGap;
        } else {
          console.log(`      ❌ 다른 행 간섭으로 왼쪽 확장 불가`);
        }
      }

      // 오른쪽 확장 가능 여부
      const nextBlock = i < sortedBlocks.length - 1 ? sortedBlocks[i + 1] : null;
      const nextColStart = nextBlock ? nextBlock.colStart : GRID_COLS;
      const rightGap = nextColStart - currentColEnd;

      if (rightGap > 0) {
        console.log(`    블록 ${current.block.id}: 오른쪽 ${rightGap}열 확장 가능`);

        // 이 블록이 다른 행에서도 오른쪽으로 확장 가능한지 확인
        if (canExpandRight(blocks, current.block, rightGap, blockPositions)) {
          console.log(`      ✅ 오른쪽 확장 실행`);
          const currentPos = blockPositions.get(current.block.id)!;
          blockPositions.set(current.block.id, {
            colStart: currentPos.colStart,
            colSpan: currentPos.colSpan + rightGap
          });
          // sortedBlocks 업데이트
          current.colSpan = current.colSpan + rightGap;
        } else {
          console.log(`      ❌ 다른 행 간섭으로 오른쪽 확장 불가`);
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

  console.log('\n✅ 빈 공간 채우기 완료');
  console.log('  최종 블록 위치:', result.map(b => ({
    id: b.id,
    row: b.row,
    colStart: b.colStart,
    colSpan: b.colSpan
  })));

  return result;
};

/**
 * 블록이 왼쪽으로 확장 가능한지 확인
 * (이 블록이 차지하는 모든 행에서 왼쪽 공간이 비어있어야 함)
 */
const canExpandLeft = (
  allBlocks: BlockPosition[],
  targetBlock: BlockPosition,
  expandAmount: number,
  blockPositions: Map<string, { colStart: number; colSpan: number }>
): boolean => {
  const targetRows = calculateRows(targetBlock.height || ROW_HEIGHT);
  const targetPos = blockPositions.get(targetBlock.id)!;
  const newColStart = targetPos.colStart - expandAmount;

  if (newColStart < 0) {
    return false;
  }

  // 이 블록이 차지하는 모든 행 체크
  for (let i = 0; i < targetRows; i++) {
    const checkRow = targetBlock.row + i;
    const occupyingBlocks = getBlocksOccupyingRow(allBlocks, checkRow);

    for (const block of occupyingBlocks) {
      if (block.id === targetBlock.id) continue;

      const blockPos = blockPositions.get(block.id)!;
      const blockColEnd = blockPos.colStart + blockPos.colSpan;

      // 확장하려는 영역과 겹치는지 확인
      if (blockColEnd > newColStart && blockPos.colStart < targetPos.colStart) {
        return false;
      }
    }
  }

  return true;
};

/**
 * 블록이 오른쪽으로 확장 가능한지 확인
 * (이 블록이 차지하는 모든 행에서 오른쪽 공간이 비어있어야 함)
 */
const canExpandRight = (
  allBlocks: BlockPosition[],
  targetBlock: BlockPosition,
  expandAmount: number,
  blockPositions: Map<string, { colStart: number; colSpan: number }>
): boolean => {
  const targetRows = calculateRows(targetBlock.height || ROW_HEIGHT);
  const targetPos = blockPositions.get(targetBlock.id)!;
  const currentColEnd = targetPos.colStart + targetPos.colSpan;
  const newColEnd = currentColEnd + expandAmount;

  if (newColEnd > GRID_COLS) {
    return false;
  }

  // 이 블록이 차지하는 모든 행 체크
  for (let i = 0; i < targetRows; i++) {
    const checkRow = targetBlock.row + i;
    const occupyingBlocks = getBlocksOccupyingRow(allBlocks, checkRow);

    for (const block of occupyingBlocks) {
      if (block.id === targetBlock.id) continue;

      const blockPos = blockPositions.get(block.id)!;

      // 확장하려는 영역과 겹치는지 확인
      if (blockPos.colStart < newColEnd && blockPos.colStart >= currentColEnd) {
        return false;
      }
    }
  }

  return true;
};
