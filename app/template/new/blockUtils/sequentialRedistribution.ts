import { BlockPosition } from '../types';
import { getBlocksOccupyingRow, getRowBlocks } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';
import { expandBlocksToFillGaps } from './expansion';

/**
 * 순차적 충돌 재정렬 (단계별 접근)
 * 1단계: 이동 블럭 + 직접 충돌 블럭들만 열 나눠먹기
 * 2단계: 1단계에서 밀린 블럭들이 간접 블럭과 충돌하면, 전체 다시 계산
 * 반복: 더 이상 새로운 충돌이 없을 때까지
 */
export const redistributeBlocksSequentially = (
  blocks: BlockPosition[],
  movedBlock: BlockPosition,
  targetRow: number
): BlockPosition[] => {
  console.log(`\n🔄 순차적 충돌 재정렬 시작`);
  console.log(`  옮겨진 블록: ${movedBlock.id}, 타겟 행: ${targetRow}`);
  console.log(`  옮겨진 블록의 colStart: ${movedBlock.colStart}, colSpan: ${movedBlock.colSpan}`);

  // 최종 할당 결과 저장
  const blockAssignments = new Map<string, { colStart: number; colSpan: number; row: number }>();

  // 옮긴 블록 초기 위치 설정
  const movedBlockWithNewPos = { ...movedBlock, row: targetRow };

  // 1단계: 이동 블럭과 연결된 모든 블럭 찾기 (직접 + 간접)
  const allConnectedBlocks = findAllConnectedBlocks(blocks, movedBlockWithNewPos);
  console.log(`\n📍 연결된 블록 탐색 완료: ${allConnectedBlocks.size}개`, Array.from(allConnectedBlocks));

  // 2단계: 연결된 모든 블록들을 한 번에 재분배
  redistributeCollidedBlocks(blocks, movedBlockWithNewPos, allConnectedBlocks, blockAssignments);

  // 할당 결과 적용
  const result = blocks
    .filter(b => b.id !== movedBlock.id)
    .map(block => {
      const assignment = blockAssignments.get(block.id);
      if (assignment) {
        return {
          ...block,
          row: assignment.row,
          colStart: assignment.colStart,
          colSpan: assignment.colSpan
        };
      }
      return block;
    });

  // 옮겨진 블록 추가
  const movedAssignment = blockAssignments.get(movedBlock.id);
  if (movedAssignment) {
    result.push({
      ...movedBlock,
      row: movedAssignment.row,
      colStart: movedAssignment.colStart,
      colSpan: movedAssignment.colSpan
    });
  } else {
    result.push(movedBlockWithNewPos);
  }

  console.log(`\n✅ 순차적 충돌 재정렬 완료 - ${result.length}개 블록`);

  // 빈 공간 확장
  const expandedResult = expandBlocksToFillGaps(result);

  return expandedResult;
};

/**
 * 이동 블럭과 연결된 모든 블럭 찾기 (직접 충돌 + 간접 충돌)
 * - 직접 충돌: 이동 블럭과 행+열이 겹치는 블럭
 * - 간접 충돌: 직접 충돌 블럭과 같은 행을 공유하는 모든 블럭 (열 상관없이)
 */
function findAllConnectedBlocks(
  blocks: BlockPosition[],
  movedBlock: BlockPosition
): Set<string> {
  const connectedBlocks = new Set<string>([movedBlock.id]);
  const toCheck: BlockPosition[] = [movedBlock];
  const affectedRows = new Set<number>();

  console.log(`\n🔍 연결된 블록 탐색 시작: ${movedBlock.id}`);

  while (toCheck.length > 0) {
    const currentBlock = toCheck.shift()!;
    const currentBlockRows = calculateRows(currentBlock.height || ROW_HEIGHT);
    const currentColEnd = currentBlock.colStart + currentBlock.colSpan;

    console.log(`\n  검사 중: ${currentBlock.id} (행 ${currentBlock.row}~${currentBlock.row + currentBlockRows - 1}, 열 ${currentBlock.colStart}~${currentColEnd})`);

    // 이 블럭이 차지하는 모든 행 검사
    for (let i = 0; i < currentBlockRows; i++) {
      const row = currentBlock.row + i;
      affectedRows.add(row);
      const blocksOnRow = getBlocksOccupyingRow(blocks, row);

      for (const block of blocksOnRow) {
        // 이미 확인한 블럭이면 스킵
        if (connectedBlocks.has(block.id)) continue;

        // 열 겹침 확인
        const blockColEnd = block.colStart + block.colSpan;
        const hasColumnOverlap = currentBlock.colStart < blockColEnd && currentColEnd > block.colStart;

        if (hasColumnOverlap) {
          console.log(`    ⚠️  직접 충돌: ${block.id} (행 ${row}, 열 ${block.colStart}~${blockColEnd})`);
          connectedBlocks.add(block.id);
          toCheck.push(block);
        }
      }
    }
  }

  // 2단계: 영향받는 행에 있는 모든 블럭 추가 (간접 충돌)
  console.log(`\n🔍 2단계: 영향받는 행 ${Array.from(affectedRows).sort((a, b) => a - b)}에서 간접 블럭 찾기`);

  for (const row of affectedRows) {
    const blocksOnRow = getBlocksOccupyingRow(blocks, row);

    for (const block of blocksOnRow) {
      if (!connectedBlocks.has(block.id)) {
        console.log(`    ⚠️  간접 충돌: ${block.id} (행 ${row}에서 발견, 열 ${block.colStart}~${block.colStart + block.colSpan})`);
        connectedBlocks.add(block.id);
      }
    }
  }

  console.log(`\n✅ 총 ${connectedBlocks.size}개 연결된 블록:`, Array.from(connectedBlocks));
  return connectedBlocks;
}

/**
 * 충돌한 블록들을 열로 재분배
 */
function redistributeCollidedBlocks(
  blocks: BlockPosition[],
  movedBlock: BlockPosition,
  collidedBlocks: Set<string>,
  blockAssignments: Map<string, { colStart: number; colSpan: number; row: number }>
): void {
  console.log(`\n🔄 충돌 블록 재분배: ${collidedBlocks.size}개`);

  // 연결된 모든 블록 객체 가져오기
  const connectedBlockObjs: BlockPosition[] = [];
  for (const blockId of collidedBlocks) {
    if (blockId === movedBlock.id) {
      connectedBlockObjs.push(movedBlock);
    } else {
      const block = blocks.find(b => b.id === blockId);
      if (block) connectedBlockObjs.push(block);
    }
  }

  // colStart 기준 정렬 (원래 위치 기준)
  connectedBlockObjs.sort((a, b) => {
    const aCol = a.id === movedBlock.id ? movedBlock.colStart : a.colStart;
    const bCol = b.id === movedBlock.id ? movedBlock.colStart : b.colStart;
    return aCol - bCol;
  });

  console.log(`  정렬 순서:`, connectedBlockObjs.map(b => b.id));

  // 전체 블록 수로 6열 균등 분배
  const totalBlocks = connectedBlockObjs.length;
  const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
  const remainder = GRID_COLS % totalBlocks;

  console.log(`  ${totalBlocks}개 블록 → 평균 ${avgColSpan}열, 나머지 ${remainder}`);

  let currentColStart = 0;

  connectedBlockObjs.forEach((block, index) => {
    const colSpan = avgColSpan + (index < remainder ? 1 : 0);

    blockAssignments.set(block.id, {
      colStart: currentColStart,
      colSpan,
      row: block.row
    });

    console.log(`    ${block.id}: colStart=${currentColStart}, colSpan=${colSpan}`);

    currentColStart += colSpan;
  });
}

/**
 * 블록 제거 후 남은 블록들을 재정렬
 */
export const redistributeAfterRemoval = (
  blocks: BlockPosition[],
  removedBlockOriginalRow: number
): BlockPosition[] => {
  console.log(`\n🔄 블록 제거 후 재정렬 시작 - 제거된 블록의 원래 행: ${removedBlockOriginalRow}`);

  // 제거된 블록이 있던 행에서 시작하는 블록들 찾기
  const startingBlocks = getRowBlocks(blocks, removedBlockOriginalRow);

  if (startingBlocks.length === 0) {
    console.log(`  행 ${removedBlockOriginalRow}에 블록 없음 - 재정렬 불필요`);
    return blocks;
  }

  console.log(`  행 ${removedBlockOriginalRow}에 ${startingBlocks.length}개 블록 시작`);

  // 이 행에서 시작하는 블록들이 연결된 모든 블록 찾기
  const connectedBlockIds = new Set<string>();
  const rowsToCheck = new Set<number>([removedBlockOriginalRow]);

  let previousConnectedSize = 0;
  let previousRowsSize = 0;

  while (connectedBlockIds.size !== previousConnectedSize || rowsToCheck.size !== previousRowsSize) {
    previousConnectedSize = connectedBlockIds.size;
    previousRowsSize = rowsToCheck.size;

    const currentRowsToCheck = Array.from(rowsToCheck);
    for (const row of currentRowsToCheck) {
      const blocksOnRow = getBlocksOccupyingRow(blocks, row);

      for (const block of blocksOnRow) {
        if (!connectedBlockIds.has(block.id)) {
          connectedBlockIds.add(block.id);

          // 멀티행 블록이면 차지하는 다른 행들도 추가
          const blockRows = calculateRows(block.height || ROW_HEIGHT);
          if (blockRows > 1) {
            for (let i = 0; i < blockRows; i++) {
              rowsToCheck.add(block.row + i);
            }
          }
        }
      }
    }
  }

  console.log(`  연결된 블록 ID: ${connectedBlockIds.size}개`, Array.from(connectedBlockIds));
  console.log(`  영향받는 행:`, Array.from(rowsToCheck).sort((a, b) => a - b));

  if (connectedBlockIds.size === 0) {
    return blocks;
  }

  // 연결된 블록들만 재정렬 (전체 블록 개수 기준으로 열 나누기)
  const totalBlocks = connectedBlockIds.size;
  const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
  const remainder = GRID_COLS % totalBlocks;

  console.log(`\n  전체 ${totalBlocks}개 블록 → 평균 ${avgColSpan}열`);

  const blockAssignments = new Map<string, { colStart: number; colSpan: number }>();

  // colStart 순으로 정렬
  const sortedBlocks = Array.from(connectedBlockIds)
    .map(id => blocks.find(b => b.id === id)!)
    .filter(b => b)
    .sort((a, b) => a.colStart - b.colStart);

  let currentColStart = 0;

  sortedBlocks.forEach((block, index) => {
    const colSpan = avgColSpan + (index < remainder ? 1 : 0);

    blockAssignments.set(block.id, {
      colStart: currentColStart,
      colSpan
    });

    console.log(`    ${block.id}: colStart=${currentColStart}, colSpan=${colSpan}`);

    currentColStart += colSpan;
  });

  // 할당 결과 적용
  const result = blocks.map(block => {
    const assignment = blockAssignments.get(block.id);
    if (assignment) {
      return {
        ...block,
        colStart: assignment.colStart,
        colSpan: assignment.colSpan
      };
    }
    return block;
  });

  console.log(`\n✅ 블록 제거 후 재정렬 완료`);

  // 빈 공간 확장
  const expandedResult = expandBlocksToFillGaps(result);

  return expandedResult;
};
