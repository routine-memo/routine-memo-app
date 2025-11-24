import { BlockPosition } from '../types';
import { getBlocksOccupyingRow, getRowBlocks } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';
import { expandBlocksToFillGaps } from './expansion';

// 블록 그룹 정의 (우선순위별)
interface BlockGroup {
  priority: number;
  blockIds: Set<string>;
  description: string;
}

/**
 * 순차적 재정렬: 우선순위 그룹을 하나씩 추가하면서 누적 재계산
 */
export const redistributeBlocksSequentially = (
  blocks: BlockPosition[],
  movedBlock: BlockPosition,
  targetRow: number
): BlockPosition[] => {
  console.log(`\n🔄 순차적 재정렬 시작`);
  console.log(`  옮겨진 블록: ${movedBlock.id}, 타겟 행: ${targetRow}`);

  // 1단계: 우선순위별로 블록 그룹화
  const groups = categorizeBlocksByPriority(blocks, movedBlock, targetRow);

  console.log(`\n📊 우선순위 그룹:`);
  groups.forEach(group => {
    console.log(`  Priority ${group.priority} (${group.description}): ${group.blockIds.size}개 블록`);
    console.log(`    블록 ID:`, Array.from(group.blockIds));
  });

  // 2단계: 우선순위 순서대로 그룹을 추가하면서 누적 재계산
  const blockAssignments = new Map<string, { colStart: number; colSpan: number; row: number }>();
  const processedBlockIds = new Set<string>();

  for (const group of groups) {
    console.log(`\n🔸 Priority ${group.priority} 그룹 처리 중...`);

    // 이 그룹의 블록들을 processedBlockIds에 추가
    group.blockIds.forEach(id => processedBlockIds.add(id));

    console.log(`  현재까지 처리된 블록: ${processedBlockIds.size}개`);

    // 현재까지 처리된 모든 블록들이 영향을 받는 행 수집
    const affectedRows = new Set<number>();

    for (const blockId of processedBlockIds) {
      const block = blockId === movedBlock.id
        ? { ...movedBlock, row: targetRow }
        : blocks.find(b => b.id === blockId);

      if (!block) continue;

      const blockRows = calculateRows(block.height || ROW_HEIGHT);
      for (let i = 0; i < blockRows; i++) {
        affectedRows.add(block.row + i);
      }
    }

    console.log(`  영향받는 행:`, Array.from(affectedRows).sort((a, b) => a - b));

    // 각 행마다 현재까지 처리된 블록들을 재배치
    for (const row of Array.from(affectedRows).sort((a, b) => a - b)) {
      console.log(`\n  행 ${row} 처리:`);

      // 1단계: 이 행을 직접 차지하는 블록들
      const directBlocksInRow = new Set<string>();

      for (const blockId of processedBlockIds) {
        const block = blockId === movedBlock.id
          ? { ...movedBlock, row: targetRow }
          : blocks.find(b => b.id === blockId);

        if (!block) continue;

        const blockRows = calculateRows(block.height || ROW_HEIGHT);
        if (row >= block.row && row < block.row + blockRows) {
          directBlocksInRow.add(blockId);
        }
      }

      console.log(`    직접 차지하는 블록:`, Array.from(directBlocksInRow));

      // 2단계: 직접 차지하는 블록들이 다른 행에서 연결된 블록들 찾기
      const connectedBlocks = new Set<string>(directBlocksInRow);
      let previousSize = 0;

      while (connectedBlocks.size !== previousSize) {
        previousSize = connectedBlocks.size;

        // 현재 연결된 블록들이 차지하는 모든 행 찾기
        const connectedRows = new Set<number>();
        for (const blockId of connectedBlocks) {
          const block = blockId === movedBlock.id
            ? { ...movedBlock, row: targetRow }
            : blocks.find(b => b.id === blockId);

          if (!block) continue;

          const blockRows = calculateRows(block.height || ROW_HEIGHT);
          for (let i = 0; i < blockRows; i++) {
            connectedRows.add(block.row + i);
          }
        }

        // 이 행들을 차지하는 다른 처리된 블록들 추가
        for (const connectedRow of connectedRows) {
          for (const blockId of processedBlockIds) {
            const block = blockId === movedBlock.id
              ? { ...movedBlock, row: targetRow }
              : blocks.find(b => b.id === blockId);

            if (!block) continue;

            const blockRows = calculateRows(block.height || ROW_HEIGHT);
            if (connectedRow >= block.row && connectedRow < block.row + blockRows) {
              connectedBlocks.add(blockId);
            }
          }
        }
      }

      console.log(`    연결된 모든 블록:`, Array.from(connectedBlocks));

      if (directBlocksInRow.size === 0) {
        console.log(`    직접 차지하는 블록 없음, 스킵`);
        continue;
      }

      // 3단계: 연결된 모든 블록을 colStart 순서대로 정렬
      const blocksToSort: Array<{ blockId: string; block: BlockPosition }> = [];

      for (const blockId of connectedBlocks) {
        const block = blockId === movedBlock.id
          ? { ...movedBlock, row: targetRow }
          : blocks.find(b => b.id === blockId);

        if (block) {
          blocksToSort.push({ blockId, block });
        }
      }

      blocksToSort.sort((a, b) => {
        const aCol = blockAssignments.has(a.blockId)
          ? blockAssignments.get(a.blockId)!.colStart
          : a.block.colStart;
        const bCol = blockAssignments.has(b.blockId)
          ? blockAssignments.get(b.blockId)!.colStart
          : b.block.colStart;
        return aCol - bCol;
      });

      console.log(`    정렬된 블록:`, blocksToSort.map(b => b.blockId));

      // 4단계: 6열을 균등 분배
      const totalBlocks = blocksToSort.length;
      const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
      const remainder = GRID_COLS % totalBlocks;

      let currentColStart = 0;

      blocksToSort.forEach(({ blockId, block }, index) => {
        const colSpan = avgColSpan + (index < remainder ? 1 : 0);

        blockAssignments.set(blockId, {
          colStart: currentColStart,
          colSpan: colSpan,
          row: block.id === movedBlock.id ? targetRow : block.row
        });

        console.log(`      ${blockId}: colStart=${currentColStart}, colSpan=${colSpan}`);

        currentColStart += colSpan;
      });
    }
  }

  // 3단계: 할당 결과 적용
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
  }

  console.log(`\n✅ 순차적 재정렬 완료 - ${result.length}개 블록`);

  // 4단계: 빈 공간 확장
  const expandedResult = expandBlocksToFillGaps(result);

  return expandedResult;
};

/**
 * 블록들을 우선순위별로 그룹화 (열 겹침 기준)
 * 이동한 블록과 실제로 열이 겹치는 블록들만 재정렬 대상으로 포함
 */
const categorizeBlocksByPriority = (
  blocks: BlockPosition[],
  movedBlock: BlockPosition,
  targetRow: number
): BlockGroup[] => {
  const groups: BlockGroup[] = [];
  const processedIds = new Set<string>();

  // Priority 0: 옮겨진 블록
  const priority0 = new Set<string>([movedBlock.id]);
  groups.push({
    priority: 0,
    blockIds: priority0,
    description: '옮겨진 블록'
  });
  processedIds.add(movedBlock.id);

  // 옮겨진 블록의 위치 정보
  const movedBlockWithNewPos = { ...movedBlock, row: targetRow };
  const movedBlockRows = calculateRows(movedBlockWithNewPos.height || ROW_HEIGHT);
  const movedBlockColEnd = movedBlockWithNewPos.colStart + movedBlockWithNewPos.colSpan;

  // 옮겨진 블록이 차지하는 행들
  const movedBlockOccupiedRows = new Set<number>();
  for (let i = 0; i < movedBlockRows; i++) {
    movedBlockOccupiedRows.add(targetRow + i);
  }

  console.log(`  옮겨진 블록 위치: 행 ${targetRow}, 열 ${movedBlockWithNewPos.colStart}-${movedBlockColEnd}, 행 수: ${movedBlockRows}`);

  // Priority 1: 옮겨진 블록과 행+열이 모두 겹치는 블록들
  const priority1 = new Set<string>();

  for (const row of movedBlockOccupiedRows) {
    const blocksOnRow = getBlocksOccupyingRow(blocks, row);

    for (const block of blocksOnRow) {
      if (processedIds.has(block.id)) continue;

      // 열 겹침 확인
      const blockColEnd = block.colStart + block.colSpan;
      const hasColumnOverlap = movedBlockWithNewPos.colStart < blockColEnd &&
                               movedBlockColEnd > block.colStart;

      if (hasColumnOverlap) {
        priority1.add(block.id);
        processedIds.add(block.id);
        console.log(`    Priority 1: ${block.id} (행 ${block.row}, 열 ${block.colStart}-${blockColEnd}와 겹침)`);
      }
    }
  }

  if (priority1.size > 0) {
    groups.push({
      priority: 1,
      blockIds: priority1,
      description: '직접 연관 블록 (행+열 겹침)'
    });
  }

  // Priority 2 이상: 재귀적으로 연결된 블록들 찾기 (열 겹침 기준)
  let currentPriority = 2;
  let currentBlockIds = priority1;

  while (currentBlockIds.size > 0) {
    const nextBlockIds = new Set<string>();

    // 현재 우선순위 블록들이 차지하는 행과 열 범위 수집
    for (const blockId of currentBlockIds) {
      const currentBlock = blocks.find(b => b.id === blockId);
      if (!currentBlock) continue;

      const currentBlockRows = calculateRows(currentBlock.height || ROW_HEIGHT);
      const currentBlockColEnd = currentBlock.colStart + currentBlock.colSpan;

      // 이 블록이 차지하는 행들
      for (let i = 0; i < currentBlockRows; i++) {
        const row = currentBlock.row + i;
        const blocksOnRow = getBlocksOccupyingRow(blocks, row);

        for (const block of blocksOnRow) {
          if (processedIds.has(block.id)) continue;

          // 열 겹침 확인
          const blockColEnd = block.colStart + block.colSpan;
          const hasColumnOverlap = currentBlock.colStart < blockColEnd &&
                                   currentBlockColEnd > block.colStart;

          if (hasColumnOverlap) {
            nextBlockIds.add(block.id);
            processedIds.add(block.id);
            console.log(`    Priority ${currentPriority}: ${block.id} (행 ${block.row}, 열 ${block.colStart}-${blockColEnd})`);
          }
        }
      }
    }

    if (nextBlockIds.size > 0) {
      let description = '';
      if (currentPriority === 2) {
        description = '간접 연관 블록 (1차 간섭)';
      } else {
        description = `${currentPriority - 1}차 간섭 블록`;
      }

      groups.push({
        priority: currentPriority,
        blockIds: nextBlockIds,
        description
      });

      currentBlockIds = nextBlockIds;
      currentPriority++;
    } else {
      break;
    }
  }

  return groups;
};

/**
 * 블록 제거 후 남은 블록들을 재정렬
 * (이전 위치에서 연결되어 있던 블록들을 모두 재분배)
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

  // 연결된 블록들만 재정렬
  const blockAssignments = new Map<string, { colStart: number; colSpan: number }>();
  const affectedRows = Array.from(rowsToCheck).sort((a, b) => a - b);

  for (const row of affectedRows) {
    console.log(`\n  행 ${row} 처리:`);

    // 이 행을 직접 차지하는 연결된 블록들
    const directBlocksInRow = new Set<string>();

    for (const blockId of connectedBlockIds) {
      const block = blocks.find(b => b.id === blockId);
      if (!block) continue;

      const blockRows = calculateRows(block.height || ROW_HEIGHT);
      if (row >= block.row && row < block.row + blockRows) {
        directBlocksInRow.add(blockId);
      }
    }

    console.log(`    직접 차지하는 블록:`, Array.from(directBlocksInRow));

    // 재귀적으로 연결된 블록들 찾기
    const connectedInRow = new Set<string>(directBlocksInRow);
    let previousSize = 0;

    while (connectedInRow.size !== previousSize) {
      previousSize = connectedInRow.size;

      const connectedRows = new Set<number>();
      for (const blockId of connectedInRow) {
        const block = blocks.find(b => b.id === blockId);
        if (!block) continue;

        const blockRows = calculateRows(block.height || ROW_HEIGHT);
        for (let i = 0; i < blockRows; i++) {
          connectedRows.add(block.row + i);
        }
      }

      for (const connectedRow of connectedRows) {
        for (const blockId of connectedBlockIds) {
          const block = blocks.find(b => b.id === blockId);
          if (!block) continue;

          const blockRows = calculateRows(block.height || ROW_HEIGHT);
          if (connectedRow >= block.row && connectedRow < block.row + blockRows) {
            connectedInRow.add(blockId);
          }
        }
      }
    }

    console.log(`    연결된 모든 블록:`, Array.from(connectedInRow));

    if (directBlocksInRow.size === 0) {
      console.log(`    직접 차지하는 블록 없음, 스킵`);
      continue;
    }

    // 연결된 블록들을 colStart 순으로 정렬
    const blocksToSort: Array<{ blockId: string; block: BlockPosition }> = [];

    for (const blockId of connectedInRow) {
      const block = blocks.find(b => b.id === blockId);
      if (block) {
        blocksToSort.push({ blockId, block });
      }
    }

    blocksToSort.sort((a, b) => {
      const aCol = blockAssignments.has(a.blockId)
        ? blockAssignments.get(a.blockId)!.colStart
        : a.block.colStart;
      const bCol = blockAssignments.has(b.blockId)
        ? blockAssignments.get(b.blockId)!.colStart
        : b.block.colStart;
      return aCol - bCol;
    });

    console.log(`    정렬된 블록:`, blocksToSort.map(b => b.blockId));

    // 6열을 균등 분배
    const totalBlocks = blocksToSort.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
    const remainder = GRID_COLS % totalBlocks;

    let currentColStart = 0;

    blocksToSort.forEach(({ blockId }, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);

      blockAssignments.set(blockId, {
        colStart: currentColStart,
        colSpan: colSpan
      });

      console.log(`      ${blockId}: colStart=${currentColStart}, colSpan=${colSpan}`);

      currentColStart += colSpan;
    });
  }

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
