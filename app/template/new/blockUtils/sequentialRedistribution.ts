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
  console.log(`\n🔄 순차적 재정렬: 블록 ${movedBlock.id.slice(-4)} → 행 ${targetRow}`);

  // 최종 할당 결과 저장
  const blockAssignments = new Map<string, { colStart: number; colSpan: number; row: number }>();

  // 옮긴 블록 초기 위치 설정
  const movedBlockWithNewPos = { ...movedBlock, row: targetRow };

  // 1단계: 이동 블럭과 연결된 모든 블럭 찾기 (직접 + 간접)
  const allConnectedBlocks = findAllConnectedBlocks(blocks, movedBlockWithNewPos);
  console.log(`  연결된 블록: ${allConnectedBlocks.size}개`);

  // 2단계: 연결된 모든 블록들을 한 번에 재분배
  redistributeCollidedBlocks(blocks, movedBlockWithNewPos, allConnectedBlocks, blockAssignments);

  // 할당 결과 적용 (비연결 블록도 충돌 회피를 위해 재배치 필요)
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

  // 비연결 블록 재배치 (연결 블록과 겹치면 밀어내기)
  const repositionedResult = repositionNonConnectedBlocks(result, allConnectedBlocks);

  console.log(`✅ 재정렬 완료`);

  // 빈 공간 확장 (연결된 블록들은 확장 대상에서 제외)
  const expandedResult = expandBlocksToFillGaps(repositionedResult, allConnectedBlocks);

  return expandedResult;
};

/**
 * 이동 블럭과 연결된 모든 블럭 찾기 (직접 충돌 + 간접 충돌)
 * - 직접 충돌: 이동 블럭과 행+열이 겹치는 블럭
 * - 간접 충돌: 직접 충돌 블럭과 같은 행을 공유하는 블럭
 *   단, 간접 블록이 참여하려면:
 *   1) 직접 블록이 간접 블록, 이동 블록과 행을 공유해야 함
 *   2) 간접 블록과 이동 블록이 직접 블록의 서로 다른 방향에 맞닿아 있어야 함
 */
function findAllConnectedBlocks(
  blocks: BlockPosition[],
  movedBlock: BlockPosition
): Set<string> {
  const connectedBlocks = new Set<string>([movedBlock.id]);
  const directBlocks: BlockPosition[] = [];
  const toCheck: BlockPosition[] = [movedBlock];
  const affectedRows = new Set<number>();

  // 1단계: 직접 충돌 블록 찾기
  while (toCheck.length > 0) {
    const currentBlock = toCheck.shift()!;
    const currentBlockRows = calculateRows(currentBlock.height || ROW_HEIGHT);
    const currentColEnd = currentBlock.colStart + currentBlock.colSpan;

    for (let i = 0; i < currentBlockRows; i++) {
      const row = currentBlock.row + i;
      affectedRows.add(row);
      const blocksOnRow = getBlocksOccupyingRow(blocks, row);

      for (const block of blocksOnRow) {
        if (connectedBlocks.has(block.id)) continue;

        const blockColEnd = block.colStart + block.colSpan;
        const hasColumnOverlap = currentBlock.colStart < blockColEnd && currentColEnd > block.colStart;

        if (hasColumnOverlap) {
          connectedBlocks.add(block.id);
          directBlocks.push(block);
          toCheck.push(block);
        }
      }
    }
  }

  // 2단계: 간접 충돌 블록 찾기 (방향 조건 적용)
  const movedBlockColEnd = movedBlock.colStart + movedBlock.colSpan;

  for (const row of affectedRows) {
    const blocksOnRow = getBlocksOccupyingRow(blocks, row);

    for (const block of blocksOnRow) {
      if (connectedBlocks.has(block.id)) continue;

      const blockColEnd = block.colStart + block.colSpan;
      let shouldInclude = false;

      for (const directBlock of directBlocks) {
        const directBlockColEnd = directBlock.colStart + directBlock.colSpan;

        const movedOnLeftEdge = movedBlockColEnd <= directBlock.colStart + 0.5 && movedBlockColEnd >= directBlock.colStart - 0.5;
        const movedOnRightEdge = movedBlock.colStart >= directBlockColEnd - 0.5 && movedBlock.colStart <= directBlockColEnd + 0.5;

        let movedIsOnLeft = movedOnLeftEdge;
        let movedIsOnRight = movedOnRightEdge;

        if (!movedOnLeftEdge && !movedOnRightEdge) {
          const directBlockCenter = directBlock.colStart + directBlock.colSpan / 2;
          const movedBlockCenter = movedBlock.colStart + movedBlock.colSpan / 2;
          movedIsOnLeft = movedBlockCenter < directBlockCenter;
          movedIsOnRight = movedBlockCenter >= directBlockCenter;
        }

        const indirectOnLeftOfDirect = blockColEnd === directBlock.colStart;
        const indirectOnRightOfDirect = block.colStart === directBlockColEnd;

        if ((movedIsOnLeft && indirectOnRightOfDirect) ||
            (movedIsOnRight && indirectOnLeftOfDirect)) {
          shouldInclude = true;
          break;
        }
      }

      if (shouldInclude) {
        connectedBlocks.add(block.id);
      }
    }
  }

  return connectedBlocks;
}

/**
 * 충돌한 블록들을 열로 재분배
 * 새로운 로직:
 * 1. 이동블록이 차지할 각 행마다 블록 수 검증 (최대 3개)
 * 2. 각 행마다 최소 2열 유지 가능한지 검증
 * 3. 행별로 블록들을 열 재분배
 */
function redistributeCollidedBlocks(
  blocks: BlockPosition[],
  movedBlock: BlockPosition,
  collidedBlocks: Set<string>,
  blockAssignments: Map<string, { colStart: number; colSpan: number; row: number }>
): void {
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

  // 모든 연결된 블록이 차지하는 모든 행 수집
  const affectedRowsSet = new Set<number>();
  const movedBlockRows = calculateRows(movedBlock.height || ROW_HEIGHT);

  for (const block of connectedBlockObjs) {
    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    const blockStartRow = block.id === movedBlock.id ? movedBlock.row : block.row;

    for (let i = 0; i < blockRows; i++) {
      affectedRowsSet.add(blockStartRow + i);
    }
  }

  const affectedRows = Array.from(affectedRowsSet).sort((a, b) => a - b);

  // 각 행별로 "실제로 그 행을 차지하는 모든 블록" 수 계산 (이동블록 포함)
  const rowAllBlocksMap = new Map<number, BlockPosition[]>();

  for (const row of affectedRows) {
    const existingBlocksInRow = getBlocksOccupyingRow(blocks, row);
    const allBlocksInRow = [...existingBlocksInRow];
    const movedBlockEndRow = movedBlock.row + movedBlockRows - 1;
    if (row >= movedBlock.row && row <= movedBlockEndRow) {
      if (!allBlocksInRow.some(b => b.id === movedBlock.id)) {
        allBlocksInRow.push(movedBlock);
      }
    }
    rowAllBlocksMap.set(row, allBlocksInRow);
  }

  // 1단계: 각 행마다 검증 (최대 3개 블록, 최소 2열씩)
  for (const [_row, allBlocksInRow] of rowAllBlocksMap) {
    if (allBlocksInRow.length > 3 || allBlocksInRow.length * 2 > GRID_COLS) {
      return;
    }
  }

  // 연결된 블록들만 그룹핑 (열 할당용)
  const rowBlocksMap = new Map<number, BlockPosition[]>();

  for (const row of affectedRows) {
    const blocksInRow: BlockPosition[] = [];
    for (const block of connectedBlockObjs) {
      const blockRows = calculateRows(block.height || ROW_HEIGHT);
      const blockStartRow = block.id === movedBlock.id ? movedBlock.row : block.row;
      const blockEndRow = blockStartRow + blockRows - 1;
      if (row >= blockStartRow && row <= blockEndRow) {
        blocksInRow.push(block);
      }
    }
    rowBlocksMap.set(row, blocksInRow);
  }

  const sortedRows = Array.from(rowAllBlocksMap.keys()).sort((a, b) => a - b);

  // Pass 1: 각 블록이 각 행에서 받을 colSpan 계산 (최소값 추적)
  const blockMinColSpan = new Map<string, number>();

  for (const row of sortedRows) {
    const allBlocksInRow = rowAllBlocksMap.get(row)!;
    const totalBlocks = allBlocksInRow.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocks);

    for (const block of allBlocksInRow) {
      if (connectedBlockObjs.some(cb => cb.id === block.id)) {
        const currentMin = blockMinColSpan.get(block.id);
        if (currentMin === undefined || avgColSpan < currentMin) {
          blockMinColSpan.set(block.id, avgColSpan);
        }
      }
    }
  }

  // Pass 2: 가장 블록이 많은 행 기준으로 위치 할당
  let maxBlocksRow = sortedRows[0];
  let maxBlocksCount = 0;
  for (const row of sortedRows) {
    const count = rowAllBlocksMap.get(row)!.length;
    if (count > maxBlocksCount) {
      maxBlocksCount = count;
      maxBlocksRow = row;
    }
  }

  const referenceBlocks = rowAllBlocksMap.get(maxBlocksRow)!;
  const sortedRefBlocks = [...referenceBlocks].sort((a, b) => {
    const aCol = a.id === movedBlock.id ? movedBlock.colStart : a.colStart;
    const bCol = b.id === movedBlock.id ? movedBlock.colStart : b.colStart;
    return aCol - bCol;
  });

  const assignedPositions = new Map<string, { colStart: number; colSpan: number }>();
  let currentColStart = 0;

  // 기준 행의 블록들에 위치 할당 (최소 colSpan 사용)
  for (const block of sortedRefBlocks) {
    const minColSpan = blockMinColSpan.get(block.id);
    const defaultColSpan = Math.floor(GRID_COLS / maxBlocksCount);
    const colSpan = minColSpan !== undefined ? minColSpan : defaultColSpan;

    if (connectedBlockObjs.some(cb => cb.id === block.id)) {
      assignedPositions.set(block.id, { colStart: currentColStart, colSpan });
    }
    currentColStart += colSpan;
  }

  // 나머지 공간이 있으면 마지막 연결된 블록에 추가
  if (currentColStart < GRID_COLS) {
    const remainingCols = GRID_COLS - currentColStart;
    const assignedIds = Array.from(assignedPositions.keys());
    if (assignedIds.length > 0) {
      const lastAssignedId = assignedIds[assignedIds.length - 1];
      const lastPos = assignedPositions.get(lastAssignedId)!;
      assignedPositions.set(lastAssignedId, {
        colStart: lastPos.colStart,
        colSpan: lastPos.colSpan + remainingCols
      });
    }
  }

  // Pass 3: 다른 행의 블록들도 할당
  for (const row of sortedRows) {
    if (row === maxBlocksRow) continue;

    const allBlocksInRow = rowAllBlocksMap.get(row)!;
    const totalBlocks = allBlocksInRow.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
    const remainder = GRID_COLS % totalBlocks;

    const sortedRowBlocks = [...allBlocksInRow].sort((a, b) => {
      const aPos = assignedPositions.get(a.id);
      const bPos = assignedPositions.get(b.id);
      const aCol = aPos ? aPos.colStart : (a.id === movedBlock.id ? movedBlock.colStart : a.colStart);
      const bCol = bPos ? bPos.colStart : (b.id === movedBlock.id ? movedBlock.colStart : b.colStart);
      return aCol - bCol;
    });

    // 이미 할당된 블록들의 점유 영역 수집
    const occupiedRanges: Array<{ start: number; end: number; blockId: string }> = [];
    for (const block of sortedRowBlocks) {
      if (assignedPositions.has(block.id)) {
        const pos = assignedPositions.get(block.id)!;
        occupiedRanges.push({ start: pos.colStart, end: pos.colStart + pos.colSpan, blockId: block.id });
      }
    }
    occupiedRanges.sort((a, b) => a.start - b.start);

    // 빈 공간 찾아서 할당
    let rowColStart = 0;

    for (let i = 0; i < sortedRowBlocks.length; i++) {
      const block = sortedRowBlocks[i];
      const colSpan = avgColSpan + (i < remainder ? 1 : 0);

      if (assignedPositions.has(block.id)) {
        continue;
      }

      // rowColStart가 이미 할당된 블록과 겹치면 그 뒤로 이동
      for (const range of occupiedRanges) {
        if (rowColStart < range.end && rowColStart + colSpan > range.start) {
          rowColStart = range.end;
        }
      }

      if (connectedBlockObjs.some(cb => cb.id === block.id)) {
        assignedPositions.set(block.id, { colStart: rowColStart, colSpan });
        occupiedRanges.push({ start: rowColStart, end: rowColStart + colSpan, blockId: block.id });
        occupiedRanges.sort((a, b) => a.start - b.start);
      }

      rowColStart += colSpan;
    }
  }

  // 최종 할당 결과를 blockAssignments에 저장
  for (const block of connectedBlockObjs) {
    const pos = assignedPositions.get(block.id);
    if (pos) {
      blockAssignments.set(block.id, {
        colStart: pos.colStart,
        colSpan: pos.colSpan,
        row: block.id === movedBlock.id ? movedBlock.row : block.row
      });
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

  // 최소 열 개수 검증 (블록당 최소 2열, 최대 3개 블록)
  if (totalBlocks > 3) {
    console.log(`❌ 블록 ${totalBlocks}개 (최대 3개 초과) → 재정렬 불가`);
    return blocks;
  }
  if (totalBlocks * 2 > GRID_COLS) {
    console.log(`❌ 블록 ${totalBlocks}개 × 2열 = ${totalBlocks * 2}열 필요 (6열 초과) → 재정렬 불가`);
    return blocks;
  }

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

/**
 * 비연결 블록 재배치
 * 연결 블록들이 새 위치를 차지한 후, 비연결 블록들이 겹치면 빈 공간으로 밀어냄
 *
 * 예시:
 * 기존: [A(0-2)] [B(2-4)] [M드랍(2-4)]
 * 연결 블록 재배치 후: [A(0-2)] [M(2-4)]
 * B는 비연결이라 원래 위치(2-4) 유지 → M과 겹침!
 * 이 함수가 B를 (4-6)으로 이동
 */
function repositionNonConnectedBlocks(
  blocks: BlockPosition[],
  connectedBlocks: Set<string>
): BlockPosition[] {
  // 연결된 블록들의 점유 영역 계산 (행별)
  const connectedOccupancy = new Map<number, Array<{ colStart: number; colEnd: number; blockId: string }>>();

  for (const block of blocks) {
    if (!connectedBlocks.has(block.id)) continue;

    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    for (let i = 0; i < blockRows; i++) {
      const row = block.row + i;
      if (!connectedOccupancy.has(row)) {
        connectedOccupancy.set(row, []);
      }
      connectedOccupancy.get(row)!.push({
        colStart: block.colStart,
        colEnd: block.colStart + block.colSpan,
        blockId: block.id
      });
    }
  }

  // 비연결 블록 재배치
  const result = blocks.map(block => {
    if (connectedBlocks.has(block.id)) {
      return block;
    }

    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    let needsReposition = false;

    // 이 블록이 연결 블록과 겹치는지 확인
    for (let i = 0; i < blockRows; i++) {
      const row = block.row + i;
      const occupancy = connectedOccupancy.get(row);
      if (!occupancy) continue;

      const blockColEnd = block.colStart + block.colSpan;

      for (const occupied of occupancy) {
        if (block.colStart < occupied.colEnd && blockColEnd > occupied.colStart) {
          needsReposition = true;
          break;
        }
      }
      if (needsReposition) break;
    }

    if (!needsReposition) {
      return block;
    }

    // 빈 공간 찾기
    const newPosition = findEmptySpaceForBlock(block, blocks, connectedBlocks, connectedOccupancy);

    if (newPosition) {
      return {
        ...block,
        colStart: newPosition.colStart,
        colSpan: newPosition.colSpan
      };
    } else {
      return block;
    }
  });

  return result;
}

/**
 * 블록을 위한 빈 공간 찾기
 * 블록이 차지하는 모든 행에서 공통으로 비어있는 연속 공간을 찾음
 */
function findEmptySpaceForBlock(
  targetBlock: BlockPosition,
  allBlocks: BlockPosition[],
  connectedBlocks: Set<string>,
  connectedOccupancy: Map<number, Array<{ colStart: number; colEnd: number; blockId: string }>>
): { colStart: number; colSpan: number } | null {
  const blockRows = calculateRows(targetBlock.height || ROW_HEIGHT);
  const targetColSpan = targetBlock.colSpan;

  // 블록이 차지하는 모든 행에서 점유 상태 확인
  const rowOccupancies: Array<Array<{ colStart: number; colEnd: number }>> = [];

  for (let i = 0; i < blockRows; i++) {
    const row = targetBlock.row + i;
    const occupancy: Array<{ colStart: number; colEnd: number }> = [];

    // 연결 블록 점유
    const connected = connectedOccupancy.get(row) || [];
    for (const o of connected) {
      occupancy.push({ colStart: o.colStart, colEnd: o.colEnd });
    }

    // 다른 비연결 블록 점유 (자신 제외)
    for (const block of allBlocks) {
      if (block.id === targetBlock.id) continue;
      if (connectedBlocks.has(block.id)) continue; // 연결 블록은 이미 추가됨

      const bRows = calculateRows(block.height || ROW_HEIGHT);
      if (row >= block.row && row < block.row + bRows) {
        occupancy.push({
          colStart: block.colStart,
          colEnd: block.colStart + block.colSpan
        });
      }
    }

    rowOccupancies.push(occupancy);
  }

  // 모든 행에서 공통으로 비어있는 공간 찾기
  // 0부터 6까지 각 시작점에서 targetColSpan만큼 연속 공간이 비어있는지 확인
  for (let startCol = 0; startCol <= GRID_COLS - targetColSpan; startCol++) {
    const endCol = startCol + targetColSpan;
    let isValid = true;

    for (const occupancy of rowOccupancies) {
      for (const o of occupancy) {
        // 겹침 확인
        if (startCol < o.colEnd && endCol > o.colStart) {
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
    }

    if (isValid) {
      return { colStart: startCol, colSpan: targetColSpan };
    }
  }

  // 빈 공간이 없으면 null 반환
  return null;
}
