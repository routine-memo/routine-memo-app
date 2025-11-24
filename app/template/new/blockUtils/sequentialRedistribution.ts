import { BlockPosition } from '../types';
import { getBlocksOccupyingRow } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';

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

  return result;
};

/**
 * 블록들을 우선순위별로 그룹화
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

  // 현재 확인할 블록들 (옮겨진 블록부터 시작)
  let currentPriority = 1;
  let currentBlockIds = priority0;

  // 재귀적으로 연결된 블록들 찾기
  while (currentBlockIds.size > 0) {
    const nextBlockIds = new Set<string>();

    // 현재 우선순위 블록들이 차지하는 모든 행 수집
    const currentRows = new Set<number>();

    for (const blockId of currentBlockIds) {
      const block = blockId === movedBlock.id
        ? { ...movedBlock, row: targetRow }
        : blocks.find(b => b.id === blockId);

      if (!block) continue;

      const blockRows = calculateRows(block.height || ROW_HEIGHT);
      for (let i = 0; i < blockRows; i++) {
        currentRows.add(block.row + i);
      }
    }

    // 이 행들을 차지하는 다른 블록들 찾기
    for (const row of currentRows) {
      const blocksOnRow = getBlocksOccupyingRow(blocks, row);

      for (const block of blocksOnRow) {
        if (!processedIds.has(block.id)) {
          nextBlockIds.add(block.id);
          processedIds.add(block.id);
        }
      }
    }

    if (nextBlockIds.size > 0) {
      let description = '';
      if (currentPriority === 1) {
        description = '직접 연관 블록';
      } else if (currentPriority === 2) {
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
