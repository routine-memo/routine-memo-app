import { BlockPosition } from '../types';
import { getBlocksOccupyingRow, getRowBlocks } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';
import { expandBlocksToFillGaps } from './expansion';

/**
 * 충돌 기반 순차 재정렬
 * 1. 옮긴 블록이 기존 블록과 충돌(행+열 겹침) → 밀어냄 → 열 나눠먹기
 * 2. 밀린 블록이 또 다른 블록과 충돌 → 연쇄 밀어냄 → 전체 열 나눠먹기
 * 3. 충돌 없으면 종료
 */
export const redistributeBlocksSequentially = (
  blocks: BlockPosition[],
  movedBlock: BlockPosition,
  targetRow: number
): BlockPosition[] => {
  console.log(`\n🔄 충돌 기반 재정렬 시작`);
  console.log(`  옮겨진 블록: ${movedBlock.id}, 타겟 행: ${targetRow}`);
  console.log(`  옮겨진 블록의 colStart: ${movedBlock.colStart}, colSpan: ${movedBlock.colSpan}`);

  // 최종 할당 결과 저장
  const blockAssignments = new Map<string, { colStart: number; colSpan: number; row: number }>();

  // 옮긴 블록 초기 위치 설정
  const movedBlockWithNewPos = { ...movedBlock, row: targetRow };
  console.log(`  movedBlockWithNewPos의 colStart: ${movedBlockWithNewPos.colStart}`);

  // 충돌 감지 및 재배치
  const collidedBlocks = new Set<string>([movedBlock.id]);
  detectAndResolveCollisions(blocks, movedBlockWithNewPos, collidedBlocks, blockAssignments);

  // 멀티행 블록 최소 colSpan 적용
  applyMinColSpanForMultiRowBlocks(blocks, blockAssignments);

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

  console.log(`\n✅ 충돌 기반 재정렬 완료 - ${result.length}개 블록`);

  // 빈 공간 확장
  const expandedResult = expandBlocksToFillGaps(result);

  return expandedResult;
};

/**
 * 충돌 감지 및 해결 (재귀적)
 */
function detectAndResolveCollisions(
  blocks: BlockPosition[],
  triggerBlock: BlockPosition,
  collidedBlocks: Set<string>,
  blockAssignments: Map<string, { colStart: number; colSpan: number; row: number }>
): void {
  console.log(`\n🔍 충돌 감지: ${triggerBlock.id}`);

  // 트리거 블록이 차지하는 행들
  const triggerBlockRows = calculateRows(triggerBlock.height || ROW_HEIGHT);
  const triggerColEnd = triggerBlock.colStart + triggerBlock.colSpan;

  // 각 행별로 충돌 체크
  for (let i = 0; i < triggerBlockRows; i++) {
    const row = triggerBlock.row + i;
    console.log(`\n  행 ${row} 처리:`);

    // 이 행에 있는 블록들
    const blocksOnRow = getBlocksOccupyingRow(blocks, row);
    console.log(`    행의 블록:`, blocksOnRow.map(b => b.id));

    // 충돌하는 블록들 찾기
    const collidingBlocks: BlockPosition[] = [];

    for (const block of blocksOnRow) {
      if (collidedBlocks.has(block.id)) continue;

      // 열 겹침 확인
      const blockColEnd = block.colStart + block.colSpan;
      const hasColumnOverlap = triggerBlock.colStart < blockColEnd && triggerColEnd > block.colStart;

      if (hasColumnOverlap) {
        console.log(`    ⚠️  충돌 발견: ${block.id} (열 ${block.colStart}-${blockColEnd})`);
        collidingBlocks.push(block);
        collidedBlocks.add(block.id);
      }
    }

    if (collidingBlocks.length === 0) {
      console.log(`    충돌 없음`);
      continue;
    }

    // 충돌 해결: 열 나눠먹기
    console.log(`\n  🔄 충돌 해결: ${collidedBlocks.size}개 블록이 열 나눠먹기`);

    // 이 행에서 충돌한 모든 블록들 (트리거 포함)
    const allCollidedInRow: BlockPosition[] = [triggerBlock];

    for (const block of blocksOnRow) {
      if (collidedBlocks.has(block.id) && block.id !== triggerBlock.id) {
        allCollidedInRow.push(block);
      }
    }

    // colStart 기준으로 정렬 (트리거 블록은 현재 위치 기준)
    allCollidedInRow.sort((a, b) => {
      let aCol: number;
      let bCol: number;

      if (a.id === triggerBlock.id) {
        aCol = triggerBlock.colStart; // 트리거 블록은 새 위치
      } else {
        aCol = blockAssignments.has(a.id) ? blockAssignments.get(a.id)!.colStart : a.colStart;
      }

      if (b.id === triggerBlock.id) {
        bCol = triggerBlock.colStart; // 트리거 블록은 새 위치
      } else {
        bCol = blockAssignments.has(b.id) ? blockAssignments.get(b.id)!.colStart : b.colStart;
      }

      return aCol - bCol;
    });

    console.log(`    정렬된 블록:`, allCollidedInRow.map(b => b.id));

    // 이 행에 있는 충돌 블록 개수로 6열 나누기
    const totalBlocks = allCollidedInRow.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
    const remainder = GRID_COLS % totalBlocks;

    console.log(`    이 행 ${totalBlocks}개 블록 → 평균 ${avgColSpan}열`);

    // 각 블록에 열 할당
    let currentColStart = 0;
    const newAssignments: Array<{ block: BlockPosition; colStart: number; colSpan: number }> = [];

    allCollidedInRow.forEach((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);

      newAssignments.push({
        block,
        colStart: currentColStart,
        colSpan
      });

      blockAssignments.set(block.id, {
        colStart: currentColStart,
        colSpan,
        row: block.row
      });

      console.log(`      ${block.id}: colStart=${currentColStart}, colSpan=${colSpan}`);

      currentColStart += colSpan;
    });

    // 밀린 블록들의 2차 충돌 체크
    for (const { block, colStart, colSpan } of newAssignments) {
      if (block.id === triggerBlock.id) continue;

      // 원래 위치와 다르면 밀렸다는 의미
      const originalColStart = block.colStart;
      if (colStart !== originalColStart) {
        console.log(`\n  📍 블록 ${block.id}가 밀림: ${originalColStart} → ${colStart}`);

        // 밀린 블록으로 2차 충돌 체크
        const pushedBlock = { ...block, colStart, colSpan };
        detectAndResolveCollisions(blocks, pushedBlock, collidedBlocks, blockAssignments);
      }
    }
  }
}

/**
 * 멀티행 블록 최소 colSpan 적용
 */
function applyMinColSpanForMultiRowBlocks(
  blocks: BlockPosition[],
  blockAssignments: Map<string, { colStart: number; colSpan: number; row: number }>
): void {
  console.log(`\n🔧 멀티행 블록 최소값 적용`);

  // 각 블록별로 여러 행에서 받은 할당 중 최소 colSpan 선택
  const tempAssignments = new Map<string, Map<number, { colStart: number; colSpan: number }>>();

  for (const [blockId, assignment] of blockAssignments) {
    if (!tempAssignments.has(blockId)) {
      tempAssignments.set(blockId, new Map());
    }
    tempAssignments.get(blockId)!.set(assignment.row, {
      colStart: assignment.colStart,
      colSpan: assignment.colSpan
    });
  }

  for (const [blockId, rowAssignments] of tempAssignments) {
    if (rowAssignments.size <= 1) continue;

    console.log(`  ${blockId}: ${rowAssignments.size}개 행에서 할당받음`);

    let minColSpan = GRID_COLS;
    let selectedColStart = 0;

    for (const [row, assignment] of rowAssignments) {
      console.log(`    행 ${row}: colStart=${assignment.colStart}, colSpan=${assignment.colSpan}`);
      if (assignment.colSpan < minColSpan) {
        minColSpan = assignment.colSpan;
        selectedColStart = assignment.colStart;
      }
    }

    const block = blocks.find(b => b.id === blockId);
    if (block) {
      blockAssignments.set(blockId, {
        colStart: selectedColStart,
        colSpan: minColSpan,
        row: block.row
      });
      console.log(`    → 최종: colStart=${selectedColStart}, colSpan=${minColSpan}`);
    }
  }
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
