import { BlockPosition } from './types';

const GRID_COLS = 6; // 전체 열 개수
const ROW_HEIGHT = 120; // 각 행의 높이 (px)
const ROW_GAP = 12; // 행 사이 간격 (gap-3 = 12px)

// 블록 높이로부터 차지하는 행 수 계산
export const calculateRows = (height: number): number => {
  return Math.ceil((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP));
};

// 특정 행의 블록들 가져오기 (해당 행에서 시작하는 블록만)
export const getRowBlocks = (blockPositions: BlockPosition[], row: number): BlockPosition[] => {
  return blockPositions
    .filter(b => b.row === row)
    .sort((a, b) => a.colStart - b.colStart);
};

// 특정 행을 차지하고 있는 모든 블록 가져오기 (위 행에서 시작해서 여러 행을 차지하는 블록 포함)
export const getBlocksOccupyingRow = (blockPositions: BlockPosition[], row: number): BlockPosition[] => {
  return blockPositions.filter(b => {
    const blockRows = calculateRows(b.height || ROW_HEIGHT);
    const blockEndRow = b.row + blockRows - 1;
    // 블록이 시작하는 행 <= row <= 블록이 끝나는 행
    return b.row <= row && row <= blockEndRow;
  }).sort((a, b) => a.colStart - b.colStart);
};

// 전체 행 배열 생성 (블록이 차지하는 모든 행 포함)
export const getAllRows = (blockPositions: BlockPosition[]): number[] => {
  if (blockPositions.length === 0) return [];

  // 각 블록이 차지하는 마지막 행 계산
  const maxRow = Math.max(...blockPositions.map(b => {
    const rows = calculateRows(b.height || ROW_HEIGHT);
    return b.row + rows - 1;
  }));

  return Array.from({ length: maxRow + 1 }, (_, i) => i);
};

// 행의 총 열 개수 계산
export const getTotalColSpan = (blocks: BlockPosition[]): number => {
  return blocks.reduce((sum, block) => sum + block.colSpan, 0);
};

// 행이 유효한지 검증 (총 열 개수가 GRID_COLS와 일치하는지)
export const isRowValid = (blocks: BlockPosition[]): boolean => {
  const total = getTotalColSpan(blocks);
  return total === GRID_COLS;
};

// 특정 위치에 블록을 배치할 수 있는지 확인
export const canPlaceBlockAt = (
  blocks: BlockPosition[],
  row: number,
  colStart: number,
  colSpan: number,
  excludeBlockId?: string
): boolean => {
  const rowBlocks = blocks.filter(b => b.row === row && b.id !== excludeBlockId);

  // 열 범위가 유효한지 확인
  if (colStart < 0 || colStart + colSpan > GRID_COLS) {
    return false;
  }

  // 다른 블록과 겹치는지 확인
  const colEnd = colStart + colSpan;
  for (const block of rowBlocks) {
    const blockEnd = block.colStart + block.colSpan;
    // 겹침 체크: [colStart, colEnd)와 [block.colStart, blockEnd)가 겹치는지
    if (colStart < blockEnd && colEnd > block.colStart) {
      return false;
    }
  }

  return true;
};

// 블록 삽입 시 행의 나머지 블록들 재정렬
export const redistributeRow = (
  blocks: BlockPosition[],
  row: number,
  insertedBlock?: BlockPosition
): BlockPosition[] => {
  // 해당 행을 차지하는 모든 블록 가져오기 (멀티행 블록 포함)
  const occupyingBlocks = getBlocksOccupyingRow(blocks, row);
  const totalSpan = getTotalColSpan(occupyingBlocks);

  console.log(`🔄 redistributeRow - 행 ${row}:`, {
    occupyingBlocks: occupyingBlocks.length,
    totalSpan,
    blocks: occupyingBlocks.map(b => ({ id: b.id, row: b.row, colSpan: b.colSpan, height: b.height }))
  });

  // 이미 꽉 찼으면 재정렬 불필요
  if (totalSpan === GRID_COLS) {
    console.log('✅ 이미 꽉 참, 재정렬 불필요');
    return blocks;
  }

  // 남은 공간 계산
  const remainingCols = GRID_COLS - totalSpan;
  console.log(`📏 남은 공간: ${remainingCols}열`);

  // 멀티행 블록의 확장 가능 여부 확인
  // 각 블록이 차지하는 모든 행에서 확장 가능한지 체크
  const expandableBlocks = occupyingBlocks.filter(block => {
    const blockRows = calculateRows(block.height || ROW_HEIGHT);

    // 싱글행 블록은 항상 확장 가능
    if (blockRows === 1) {
      return true;
    }

    // 멀티행 블록: 차지하는 모든 행에서 확장 가능한지 확인
    for (let i = 0; i < blockRows; i++) {
      const checkRow = block.row + i;
      const rowOccupyingBlocks = getBlocksOccupyingRow(blocks, checkRow);
      const rowTotalSpan = getTotalColSpan(rowOccupyingBlocks);

      // 어느 한 행이라도 꽉 차있으면 확장 불가
      if (rowTotalSpan >= GRID_COLS) {
        console.log(`  ⚠️ 멀티행 블록 ${block.id}: 행 ${checkRow}가 꽉 참 (${rowTotalSpan}열) → 확장 불가`);
        return false;
      }
    }

    console.log(`  ✅ 멀티행 블록 ${block.id}: 모든 행에서 확장 가능`);
    return true;
  });

  console.log(`🔍 확장 가능한 블록: ${expandableBlocks.length}/${occupyingBlocks.length}개`);

  // 확장 가능한 블록들에게만 남은 공간 분배
  const blocksToExpand = expandableBlocks.length;

  if (blocksToExpand === 0) {
    console.log('⚠️ 확장 가능한 블록이 없음 → 재정렬 불필요');
    return blocks;
  }

  // 각 블록의 새 colSpan 계산
  const extraColsPerBlock = Math.floor(remainingCols / blocksToExpand);
  const extraRemainder = remainingCols % blocksToExpand;

  let currentColStart = 0;
  let expandedCount = 0;

  const redistributedBlocks = occupyingBlocks.map((block) => {
    const isExpandable = expandableBlocks.includes(block);

    let newColSpan = block.colSpan;
    if (isExpandable) {
      newColSpan = block.colSpan + extraColsPerBlock + (expandedCount < extraRemainder ? 1 : 0);
      expandedCount++;
    }

    const newBlock = {
      ...block,
      row: block.row,
      colStart: currentColStart,
      colSpan: newColSpan
    };
    currentColStart += newBlock.colSpan;
    return newBlock;
  });

  console.log(`✅ 재분배 완료:`, redistributedBlocks.map(b => ({
    id: b.id,
    colStart: b.colStart,
    colSpan: b.colSpan,
    isMultiRow: calculateRows(b.height || ROW_HEIGHT) > 1
  })));

  // 전체 블록 배열에 적용
  const redistributedIds = new Set(redistributedBlocks.map(b => b.id));
  const otherBlocks = blocks.filter(b => !redistributedIds.has(b.id));

  return [...otherBlocks, ...redistributedBlocks];
};

// 행의 최대 높이 구하기
export const getRowMaxHeight = (blocks: BlockPosition[]): number => {
  if (blocks.length === 0) return 120; // 기본 높이
  return Math.max(...blocks.map(b => b.height), 120);
};

// 블록을 왼쪽/오른쪽으로 이동시키고 나머지 블록들 재정렬
export const moveBlockInRow = (
  blocks: BlockPosition[],
  draggedBlock: BlockPosition,
  targetBlock: BlockPosition,
  position: 'left' | 'right'
): BlockPosition[] | null => {
  console.log('📦 moveBlockInRow 시작:', {
    draggedId: draggedBlock.id,
    targetId: targetBlock.id,
    position,
    draggedRow: draggedBlock.row,
    targetRow: targetBlock.row
  });

  // 같은 행인지 확인
  if (draggedBlock.row !== targetBlock.row) {
    console.log('❌ 다른 행:', draggedBlock.row, '!=', targetBlock.row);
    return null; // 다른 행은 별도 로직
  }

  // 같은 블록이면 아무것도 안 함
  if (draggedBlock.id === targetBlock.id) {
    console.log('❌ 같은 블록');
    return blocks;
  }

  const rowBlocks = getRowBlocks(blocks, draggedBlock.row);
  console.log('📊 현재 행의 블록들:', rowBlocks.map(b => ({ id: b.id, colStart: b.colStart, colSpan: b.colSpan })));

  // 드래그한 블록과 타겟 블록의 인덱스 찾기
  const draggedIndex = rowBlocks.findIndex(b => b.id === draggedBlock.id);
  const targetIndex = rowBlocks.findIndex(b => b.id === targetBlock.id);

  if (draggedIndex === -1 || targetIndex === -1) return null;

  // 드래그한 블록을 제거하고 새 위치에 삽입
  const blocksWithoutDragged = rowBlocks.filter(b => b.id !== draggedBlock.id);
  const adjustedTargetIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;

  let newOrder: BlockPosition[];
  if (position === 'left') {
    newOrder = [
      ...blocksWithoutDragged.slice(0, adjustedTargetIndex),
      draggedBlock,
      ...blocksWithoutDragged.slice(adjustedTargetIndex)
    ];
  } else {
    newOrder = [
      ...blocksWithoutDragged.slice(0, adjustedTargetIndex + 1),
      draggedBlock,
      ...blocksWithoutDragged.slice(adjustedTargetIndex + 1)
    ];
  }

  // 총 열 수 계산
  const totalCols = getTotalColSpan(newOrder);
  console.log('📏 총 열 수:', totalCols, '/ 목표:', GRID_COLS);

  // 열이 6개가 아니면 재분배
  let finalOrder: BlockPosition[];
  if (totalCols !== GRID_COLS) {
    console.log('🔄 열 재분배 필요');
    // 균등 분배
    const avgColSpan = Math.floor(GRID_COLS / newOrder.length);
    const remainder = GRID_COLS % newOrder.length;

    let currentColStart = 0;
    finalOrder = newOrder.map((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);
      const updated = {
        ...block,
        colStart: currentColStart,
        colSpan: colSpan
      };
      currentColStart += colSpan;
      return updated;
    });
    } else {
    console.log('✅ 열 개수 맞음, colStart만 재계산');
    // 이미 6개면 colStart만 재계산
    let currentColStart = 0;
    finalOrder = newOrder.map(block => {
      const updated = { ...block, colStart: currentColStart };
      currentColStart += block.colSpan;
      return updated;
    });
  }

  // 전체 블록 배열에 적용
  const result = blocks.map(b => {
    if (b.row !== draggedBlock.row) return b;
    const updated = finalOrder.find(ub => ub.id === b.id);
    return updated || b;
  });

  console.log('🎯 최종 결과:', result.filter(b => b.row === draggedBlock.row).map(b => ({ id: b.id, colStart: b.colStart, colSpan: b.colSpan })));
  return result;
};

// 블록을 다른 행의 블록 옆에 배치
export const moveBlockToRowSide = (
  blocks: BlockPosition[],
  draggedBlock: BlockPosition,
  targetBlock: BlockPosition,
  position: 'left' | 'right',
  targetRow?: number // 멀티행 블록의 경우 특정 행 지정
): BlockPosition[] | null => {
  // targetRow가 지정되어 있으면 사용, 없으면 targetBlock.row 사용
  const effectiveTargetRow = targetRow !== undefined ? targetRow : targetBlock.row;


  // 1. 드래그한 블록을 원래 행에서 제거
  let updatedBlocks = blocks.filter(b => b.id !== draggedBlock.id);

  // 2. 원래 행의 블록들 재정렬
  const originalRowBlocks = getRowBlocks(updatedBlocks, draggedBlock.row);
  let adjustedTargetRow = effectiveTargetRow;

  if (originalRowBlocks.length > 0) {
    updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);
  } else {
    // 원래 행이 비었으면 아래 행들을 올림
    updatedBlocks = updatedBlocks.map(b => {
      if (b.row > draggedBlock.row) {
        return { ...b, row: b.row - 1 };
      }
      return b;
    });

    // 타겟 행이 원래 행보다 아래에 있으면 행 번호가 1 감소
    if (effectiveTargetRow > draggedBlock.row) {
      adjustedTargetRow = effectiveTargetRow - 1;
      console.log('📍 타겟 행 조정:', effectiveTargetRow, '→', adjustedTargetRow);
    }
  }

  // 3. 타겟 행을 차지하는 모든 블록들 가져오기
  // 멀티행이든 싱글행이든 상관없이 해당 행을 차지하는 모든 블록 포함
  const occupyingBlocks = getBlocksOccupyingRow(updatedBlocks, adjustedTargetRow);

  console.log(`🔍 타겟 행 ${adjustedTargetRow}을 차지하는 블록:`, occupyingBlocks.map(b => ({
    id: b.id,
    row: b.row,
    colStart: b.colStart,
    colSpan: b.colSpan,
    isMultiRow: calculateRows(b.height) > 1
  })));

  // 4. 삽입 위치 결정 (targetBlock의 colStart 기준)
  let insertIndex: number;

  if (position === 'left') {
    // targetBlock의 colStart보다 작은 colStart를 가진 블록들의 개수
    insertIndex = occupyingBlocks.filter(b => b.colStart < targetBlock.colStart).length;
  } else {
    // targetBlock의 colStart보다 작거나 같은 colStart를 가진 블록들의 개수
    insertIndex = occupyingBlocks.filter(b => b.colStart <= targetBlock.colStart).length;
  }

  console.log(`📌 삽입 위치: targetBlock.colStart=${targetBlock.colStart}, position=${position}, insertIndex=${insertIndex}`);

  // 한 행에 최대 3개까지만 허용 (해당 행에서 시작하는 블록 기준)
  const startingBlocks = getRowBlocks(updatedBlocks, adjustedTargetRow);
  if (startingBlocks.length >= 3) {
    console.log(`❌ 타겟 행 ${adjustedTargetRow}에 이미 블록 3개 시작`);
    return null;
  }

  // 5. 멀티행 블록인지 확인
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);

  if (draggedBlockRows > 1) {
    // 멀티행 블록: 연결된 모든 블록들을 추적하여 일관된 열 분배
    console.log(`🔍 멀티행 블록 (${draggedBlockRows}행) 배치 - 연결된 블록 그룹 추적 시작`);

    // 1단계: 드롭한 블록이 차지할 모든 행 수집
    const movedBlockRows = new Set<number>();
    for (let i = 0; i < draggedBlockRows; i++) {
      movedBlockRows.add(adjustedTargetRow + i);
    }
    console.log(`  드롭 블록이 차지할 행:`, Array.from(movedBlockRows));

    // 2단계: 연결된 모든 블록들을 재귀적으로 수집
    const connectedBlockIds = new Set<string>();
    const rowsToCheck = new Set(movedBlockRows);

    // 재귀적으로 연결된 블록들 찾기
    let previousConnectedSize = 0;
    let previousRowsSize = 0;

    while (connectedBlockIds.size !== previousConnectedSize || rowsToCheck.size !== previousRowsSize) {
      previousConnectedSize = connectedBlockIds.size;
      previousRowsSize = rowsToCheck.size;

      const currentRowsToCheck = Array.from(rowsToCheck);
      for (const row of currentRowsToCheck) {
        const blocksOnRow = getBlocksOccupyingRow(updatedBlocks, row);

        for (const block of blocksOnRow) {
          if (!connectedBlockIds.has(block.id)) {
            connectedBlockIds.add(block.id);
            console.log(`    블록 ${block.id} 추가 (행 ${block.row}에서 발견)`);

            // 이 블록이 멀티행이면, 차지하는 다른 행들도 추가
            const blockRows = calculateRows(block.height || ROW_HEIGHT);
            if (blockRows > 1) {
              for (let i = 0; i < blockRows; i++) {
                const newRow = block.row + i;
                if (!rowsToCheck.has(newRow)) {
                  rowsToCheck.add(newRow);
                  console.log(`      → 행 ${newRow} 추가 (블록이 ${blockRows}행 차지)`);
                }
              }
            }
          }
        }
      }
    }

    console.log(`  연결된 블록 ID:`, Array.from(connectedBlockIds));
    console.log(`  영향받는 행:`, Array.from(rowsToCheck).sort((a, b) => a - b));

    // 3단계: 연결된 모든 블록을 colStart 순서대로 정렬하여 순서 결정
    // 중요: 타겟 행에만 있는 블록이 아니라, 연결된 모든 블록을 포함해야 함
    const connectedBlocks = updatedBlocks.filter(b => connectedBlockIds.has(b.id));

    // colStart로 정렬 (왼쪽부터 오른쪽 순서)
    connectedBlocks.sort((a, b) => a.colStart - b.colStart);

    console.log(`  연결된 블록들 (정렬됨):`, connectedBlocks.map(b => ({
      id: b.id,
      row: b.row,
      colStart: b.colStart,
      colSpan: b.colSpan
    })));

    // 드롭되는 블록을 insertIndex 위치에 삽입
    // insertIndex는 occupyingBlocks 기준이므로, 연결된 블록들 중에서 타겟 블록의 위치를 찾아야 함
    const targetBlockIndexInConnected = connectedBlocks.findIndex(b => b.id === targetBlock.id);

    let finalInsertIndex: number;
    if (targetBlockIndexInConnected === -1) {
      // 타겟 블록이 연결된 블록에 없으면 (이론상 불가능) 맨 끝에 추가
      finalInsertIndex = connectedBlocks.length;
    } else {
      // position이 'left'면 타겟 앞에, 'right'면 타겟 뒤에
      finalInsertIndex = position === 'left' ? targetBlockIndexInConnected : targetBlockIndexInConnected + 1;
    }

    console.log(`  드롭 블록 삽입 위치: ${finalInsertIndex} (타겟 블록 인덱스: ${targetBlockIndexInConnected}, position: ${position})`);

    const blocksInOrder = [
      ...connectedBlocks.slice(0, finalInsertIndex),
      { ...draggedBlock, row: adjustedTargetRow, colStart: 0, colSpan: 1 }, // 임시값
      ...connectedBlocks.slice(finalInsertIndex)
    ];

    // 4단계: 열 균등 분배 계산
    const totalBlocksInFirstRow = blocksInOrder.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocksInFirstRow);
    const remainder = GRID_COLS % totalBlocksInFirstRow;

    console.log(`  전체 연결된 블록 수: ${totalBlocksInFirstRow}, 평균 colSpan: ${avgColSpan}`);

    // 5단계: 모든 블록에 colSpan 할당
    // blocksInOrder에는 이미 연결된 모든 블록이 포함되어 있으므로, 순서대로 열 할당만 하면 됨
    let currentColStart = 0;
    const blockColSpans = new Map<string, { colStart: number; colSpan: number }>();

    // 연결된 모든 블록들 순서대로 열 할당
    blocksInOrder.forEach((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);
      blockColSpans.set(block.id, {
        colStart: currentColStart,
        colSpan: colSpan
      });
      currentColStart += colSpan;
    });

    console.log(`  블록별 열 할당:`, Array.from(blockColSpans.entries()).map(([id, { colStart, colSpan }]) => ({
      id,
      colStart,
      colSpan
    })));

    // 6단계: 모든 블록들(연결된 블록 + occupyingBlocks)에 일관된 colSpan 적용
    const movedBlock = {
      ...draggedBlock,
      row: adjustedTargetRow,
      colStart: blockColSpans.get(draggedBlock.id)!.colStart,
      colSpan: blockColSpans.get(draggedBlock.id)!.colSpan
    };

    // occupyingBlocks에 있는 모든 블록 ID 수집
    const occupyingBlockIds = new Set(occupyingBlocks.map(b => b.id));

    // 연결된 블록 + occupyingBlocks의 합집합
    const allAffectedIds = new Set([...connectedBlockIds, ...occupyingBlockIds]);

    // 모든 영향받는 블록 업데이트
    const updatedAffectedBlocks = updatedBlocks
      .filter(b => allAffectedIds.has(b.id))
      .map(block => {
        const assignment = blockColSpans.get(block.id);
        if (assignment) {
          return {
            ...block,
            colStart: assignment.colStart,
            colSpan: assignment.colSpan
          };
        }
        return block;
      });

    // 7단계: finalBlocks 구성
    const finalBlocks = [
      ...updatedBlocks.filter(b => !allAffectedIds.has(b.id)),
      ...updatedAffectedBlocks,
      movedBlock
    ];

    console.log(`✅ 멀티행 블록 배치 완료 - 최종: row=${movedBlock.row}, colStart=${movedBlock.colStart}, colSpan=${movedBlock.colSpan}`);

    return finalBlocks;
  } else {
    // 싱글행 블록인 경우 기존 로직 사용 (타겟 행만 재분배)
    console.log(`📍 싱글행 블록 배치 - 행 ${adjustedTargetRow} 재분배`);

    // occupyingBlocks의 순서대로 colStart 정렬된 상태에서 insertIndex 위치에 삽입
    const blocksInOrder = [
      ...occupyingBlocks.slice(0, insertIndex),
      { ...draggedBlock, row: adjustedTargetRow, colStart: 0, colSpan: 0 }, // 임시값
      ...occupyingBlocks.slice(insertIndex)
    ];

    console.log(`📋 새 순서 (${blocksInOrder.length}개):`, blocksInOrder.map(b => ({ id: b.id, row: b.row })));

    // 열 균등 분배
    const avgColSpan = Math.floor(GRID_COLS / blocksInOrder.length);
    const remainder = GRID_COLS % blocksInOrder.length;

    let currentColStart = 0;
    const redistributedBlocks = blocksInOrder.map((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);

      // 새 블록이면 row를 adjustedTargetRow로 설정
      // 기존 블록이면 원래 row 유지 (멀티행 블록도 원래 row 유지)
      const updated = {
        ...block,
        row: block.id === draggedBlock.id ? adjustedTargetRow : block.row,
        colStart: currentColStart,
        colSpan: colSpan
      };
      currentColStart += colSpan;
      return updated;
    });

    console.log(`🔢 재분배 결과:`, redistributedBlocks.map(b => ({
      id: b.id,
      row: b.row,
      colStart: b.colStart,
      colSpan: b.colSpan
    })));

    // redistributedBlocks에 포함된 블록들의 ID를 제외한 나머지 블록들
    const redistributedIds = new Set(redistributedBlocks.map(b => b.id));
    const otherBlocks = updatedBlocks.filter(b => !redistributedIds.has(b.id));

    return [...otherBlocks, ...redistributedBlocks];
  }
};

// 블록을 다른 행으로 이동
export const moveBlockToRow = (
  blocks: BlockPosition[],
  draggedBlock: BlockPosition,
  targetBlock: BlockPosition,
  position: 'above' | 'below'
): BlockPosition[] | null => {
  console.log('⬆️⬇️ moveBlockToRow 시작:', {
    draggedId: draggedBlock.id,
    draggedRow: draggedBlock.row,
    targetId: targetBlock.id,
    targetRow: targetBlock.row,
    targetHeight: targetBlock.height,
    position
  });

  // ===== STEP 1: 목표 행 결정 (블록 제거 전에 계산) =====
  let destinationRow: number;

  if (position === 'above') {
    destinationRow = targetBlock.row;
  } else {
    // 타겟 블록이 차지하는 행 수 계산
    const targetBlockRows = calculateRows(targetBlock.height || ROW_HEIGHT);
    const targetBlockLastRow = targetBlock.row + targetBlockRows - 1;
    destinationRow = targetBlockLastRow + 1;
  }

  console.log('🎯 목표 행 결정 (제거 전):', {
    position,
    targetBlockRow: targetBlock.row,
    targetBlockHeight: targetBlock.height,
    targetBlockRows: calculateRows(targetBlock.height || ROW_HEIGHT),
    destinationRow
  });

  // 드래그 중인 블록이 이미 목표 행에 있으면 아무것도 하지 않음
  if (draggedBlock.row === destinationRow) {
    console.log('⚠️ 드래그 블록이 이미 목표 행에 있음 → 변경 없음');
    return blocks;
  }

  // ===== STEP 2: 현재 존재하는 최대 행 확인 =====
  const blocksExcludingDragged = blocks.filter(b => b.id !== draggedBlock.id);

  // 현재 존재하는 최대 행 계산
  const currentMaxRow = blocksExcludingDragged.length > 0
    ? Math.max(...blocksExcludingDragged.map(b => {
        const rows = calculateRows(b.height || ROW_HEIGHT);
        return b.row + rows - 1;
      }))
    : -1;

  // below 드롭 시: 목표 행에 블록이 있는지 확인 (드래그 중인 블록 제외)
  // 목표 행에서 시작하는 블록뿐만 아니라, 목표 행을 차지하는 모든 블록 확인 (멀티행 블록 포함)
  const destinationRowOccupyingBlocks = getBlocksOccupyingRow(blocksExcludingDragged, destinationRow);
  const hasBlocksAtDestination = destinationRowOccupyingBlocks.length > 0;

  // 드래그 중인 블록이 원래 목표 행에 있었는지 확인
  const draggedBlockWasAtDestination = draggedBlock.row === destinationRow;

  // above 드롭의 경우 목표 행(= targetBlock.row)에 블록을 삽입하고 기존 블록들을 밀어내야 함
  // below 드롭의 경우:
  //   - 목표 행에 다른 블록이 있으면 새 행 삽입
  //   - 단, 드래그 중인 블록이 원래 그 행에 있었다면 제외
  const needNewRowInsertion =
    (position === 'above') || // above는 항상 새 행 삽입
    (position === 'below' && hasBlocksAtDestination && !draggedBlockWasAtDestination);

  console.log('📊 현재 상태:', {
    destinationRow,
    currentMaxRow,
    position,
    hasBlocksAtDestination,
    occupyingBlocks: destinationRowOccupyingBlocks.map(b => ({ id: b.id, row: b.row })),
    needNewRowInsertion,
    isNewRow: destinationRow > currentMaxRow || needNewRowInsertion
  });

  // 목표 행이 현재 존재하지 않거나, below 드롭 시 이미 블록이 있으면 새 행 생성
  if (destinationRow > currentMaxRow || needNewRowInsertion) {
    console.log('🆕 새 행 삽입 필요 (이유:', destinationRow > currentMaxRow ? '최대행 초과' : 'below 드롭 시 충돌', ')');

    // 원래 행 정리 수행
    let updatedBlocks = blocksExcludingDragged;
    const originalRowOccupyingBlocks = getBlocksOccupyingRow(updatedBlocks, draggedBlock.row);

    if (originalRowOccupyingBlocks.length === 0) {
      // 원래 행이 비었으면 아래 행들을 올림
      updatedBlocks = updatedBlocks.map(b => {
        if (b.row > draggedBlock.row) {
          return { ...b, row: b.row - 1 };
        }
        return b;
      });
      // 목표 행도 조정
      destinationRow = Math.max(0, destinationRow - 1); // 음수 방지
      console.log('📍 빈 행 제거로 목표 행 조정:', destinationRow);
    } else {
      // 원래 행에 블록이 남아있으면 재정렬
      console.log(`🔄 원래 행 재정렬 시작 (새 행 생성): 행 ${draggedBlock.row}에서 재정렬`);
      console.log(`   영향받는 블록:`, originalRowOccupyingBlocks.map(b => ({
        id: b.id,
        row: b.row,
        colSpan: b.colSpan
      })));

      // 원래 행에 대해 재정렬 수행 (해당 행을 차지하는 모든 블록 포함)
      updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);

      console.log('✅ 원래 행 재정렬 완료 (새 행 생성 케이스)');
    }

    // 목표 행 이상의 블록들을 아래로 밀기 (새 행 삽입)
    // 멀티행 블록의 경우 차지하는 행 수만큼 밀어내야 함
    const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);
    if (needNewRowInsertion) {
      // destinationRow를 차지하는 멀티행 블록이 있으면, 그 블록의 시작 행부터 밀어내야 함
      const blocksOccupyingDestination = getBlocksOccupyingRow(updatedBlocks, destinationRow);
      const minRowToShift = blocksOccupyingDestination.length > 0
        ? Math.min(destinationRow, ...blocksOccupyingDestination.map(b => b.row))
        : destinationRow;

      console.log(`🔽 행 ${minRowToShift} 이상의 블록들을 ${draggedBlockRows}행만큼 아래로 밀기`, {
        destinationRow,
        occupyingBlocks: blocksOccupyingDestination.length,
        minRowToShift
      });

      updatedBlocks = updatedBlocks.map(b => {
        if (b.row >= minRowToShift) {
          return { ...b, row: b.row + draggedBlockRows };
        }
        return b;
      });

      // destinationRow도 조정 (멀티행 블록 때문에 더 위쪽 행부터 밀었으면 destinationRow도 조정)
      destinationRow = minRowToShift;
    }

    // 새 행에 블록 배치
    // 멀티행 블록인 경우, 차지할 모든 행에 대해 열 재분배 수행
    let movedBlock: BlockPosition = {
      ...draggedBlock,
      row: destinationRow,
      colStart: 0,
      colSpan: GRID_COLS
    };

    if (draggedBlockRows > 1) {
      console.log(`🔍 멀티행 블록 (${draggedBlockRows}행) 배치 - 각 행별 재분배 시작:`);

      // 임시로 블록을 추가
      let blocksWithNew = [...updatedBlocks, movedBlock];

      // 차지할 모든 행에 대해 재분배 필요 여부 확인 및 실행
      for (let checkRow = destinationRow; checkRow < destinationRow + draggedBlockRows; checkRow++) {
        const rowOccupyingBlocks = getBlocksOccupyingRow(blocksWithNew, checkRow);

        // 새로 추가된 블록 외에 다른 블록이 있는지 확인
        const otherBlocks = rowOccupyingBlocks.filter(b => b.id !== movedBlock.id);

        console.log(`  행 ${checkRow}: 기존 블록 ${otherBlocks.length}개${otherBlocks.length > 0 ? ' → 재분배 실행' : ' → 재분배 불필요'}`);

        if (otherBlocks.length > 0) {
          // 다른 블록이 있으면 재분배
          blocksWithNew = redistributeRow(blocksWithNew, checkRow);

          // 재분배 후 movedBlock 업데이트
          const redistributedMovedBlock = blocksWithNew.find(b => b.id === movedBlock.id);
          if (redistributedMovedBlock) {
            movedBlock = redistributedMovedBlock;
            console.log(`    재분배 결과: colStart=${movedBlock.colStart}, colSpan=${movedBlock.colSpan}`);
          }
        }
      }

      console.log(`  → 최종 멀티행 블록 배치:`, {
        row: movedBlock.row,
        colStart: movedBlock.colStart,
        colSpan: movedBlock.colSpan,
        rows: draggedBlockRows
      });

      // 재분배가 완료된 blocksWithNew를 updatedBlocks로 업데이트
      updatedBlocks = blocksWithNew.filter(b => b.id !== movedBlock.id);
    }

    console.log('✅ 새 블록 위치 (새 행):', {
      row: movedBlock.row,
      colStart: movedBlock.colStart,
      colSpan: movedBlock.colSpan,
      rows: draggedBlockRows
    });

    return [...updatedBlocks, movedBlock];
  }

  // ===== STEP 3: 목표 행이 존재하는 경우 - 기존 로직 =====
  const destinationRowBlocks = getBlocksOccupyingRow(blocksExcludingDragged, destinationRow);
  const usedCols = getTotalColSpan(destinationRowBlocks);
  const availableCols = GRID_COLS - usedCols;

  console.log('📊 목표 행 분석 (제거 전):', {
    destinationRow,
    blocksOccupying: destinationRowBlocks.length,
    blockDetails: destinationRowBlocks.map(b => ({
      id: b.id,
      startRow: b.row,
      height: b.height,
      rows: calculateRows(b.height || ROW_HEIGHT),
      colStart: b.colStart,
      colSpan: b.colSpan
    })),
    usedCols,
    availableCols
  });

  // ===== STEP 4: 드래그한 블록 제거 및 원래 행 정리 =====
  let updatedBlocks = blocksExcludingDragged;

  // 원래 행이 비어있는지 확인 (해당 행을 차지하는 모든 블록 확인)
  const originalRowOccupyingBlocks = getBlocksOccupyingRow(updatedBlocks, draggedBlock.row);

  console.log(`🔍 원래 행 ${draggedBlock.row} 상태:`, {
    occupyingBlocks: originalRowOccupyingBlocks.length,
    blocks: originalRowOccupyingBlocks.map(b => ({ id: b.id, row: b.row, colSpan: b.colSpan })),
    draggedRow: draggedBlock.row,
    targetRow: targetBlock.row,
    condition: draggedBlock.row !== targetBlock.row
  });

  if (originalRowOccupyingBlocks.length === 0) {
    // 원래 행이 완전히 비었으면 아래 행들을 올림
    console.log(`📍 원래 행 ${draggedBlock.row} 비어있음, 아래 행들을 올림`);

    updatedBlocks = updatedBlocks.map(b => {
      if (b.row > draggedBlock.row) {
        return { ...b, row: b.row - 1 };
      }
      return b;
    });

    // 목표 행이 원래 행보다 아래에 있으면 목표 행도 조정
    if (destinationRow > draggedBlock.row) {
      destinationRow = destinationRow - 1;
      console.log(`  → 목표 행 조정: ${destinationRow + 1} → ${destinationRow}`);
    }

    // 원래 행이 비어도, 목표 행에 멀티행 블록이 있으면 재정렬 필요
    const destinationRowOccupyingBlocks = getBlocksOccupyingRow(updatedBlocks, destinationRow);
    if (destinationRowOccupyingBlocks.length > 0) {
      console.log(`🔄 목표 행 재정렬 시작 (원래 행 비어있음): 행 ${destinationRow}에서 재정렬`);
      console.log(`   영향받는 블록:`, destinationRowOccupyingBlocks.map(b => ({
        id: b.id,
        row: b.row,
        colSpan: b.colSpan
      })));

      // 목표 행에 대해 재정렬 수행 (해당 행을 차지하는 모든 블록 포함)
      updatedBlocks = redistributeRow(updatedBlocks, destinationRow, draggedBlock);

      console.log('✅ 목표 행 재정렬 완료');
    }
  } else if (draggedBlock.row !== targetBlock.row) {
    // 원래 행에 다른 블록들이 있고, 타겟과 다른 행이면 재정렬
    // 원래 행(draggedBlock.row)에 대해 재정렬
    console.log(`🔄 원래 행 재정렬 시작 (기존 행): 행 ${draggedBlock.row}에서 재정렬`);
    console.log(`   영향받는 블록:`, originalRowOccupyingBlocks.map(b => ({
      id: b.id,
      row: b.row,
      colSpan: b.colSpan
    })));

    // 원래 행에 대해 재정렬 수행 (해당 행을 차지하는 모든 블록 포함)
    updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);

    console.log('✅ 원래 행 재정렬 완료 (기존 행 케이스)');
  }

  // ===== STEP 5: 목표 행의 최종 상태 재확인 =====
  // 행 이동 후 목표 행의 블록들을 다시 확인
  const finalDestinationRowBlocks = getBlocksOccupyingRow(updatedBlocks, destinationRow);
  const finalUsedCols = getTotalColSpan(finalDestinationRowBlocks);
  const finalAvailableCols = GRID_COLS - finalUsedCols;

  console.log('📊 목표 행 최종 분석:', {
    destinationRow,
    blocksOccupying: finalDestinationRowBlocks.length,
    blockDetails: finalDestinationRowBlocks.map(b => ({
      id: b.id,
      colStart: b.colStart,
      colSpan: b.colSpan
    })),
    usedCols: finalUsedCols,
    availableCols: finalAvailableCols
  });

  // ===== STEP 5.5: 멀티행 블록의 경우 모든 필요 행 검증 =====
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);
  let canPlaceInExistingRows = finalAvailableCols > 0;

  if (draggedBlockRows > 1 && canPlaceInExistingRows) {
    console.log(`🔍 멀티행 블록 검증 (${draggedBlockRows}행 필요):`, {
      startRow: destinationRow,
      endRow: destinationRow + draggedBlockRows - 1
    });

    // 멀티행 블록이 차지할 모든 행을 검증
    for (let checkRow = destinationRow; checkRow < destinationRow + draggedBlockRows; checkRow++) {
      const rowOccupyingBlocks = getBlocksOccupyingRow(updatedBlocks, checkRow);
      const rowUsedCols = getTotalColSpan(rowOccupyingBlocks);
      const rowAvailableCols = GRID_COLS - rowUsedCols;

      console.log(`  행 ${checkRow}: 사용 ${rowUsedCols}열, 여유 ${rowAvailableCols}열`);

      // 해당 행이 완전히 차있으면 배치 불가
      if (rowAvailableCols === 0) {
        console.log(`  ⚠️ 행 ${checkRow}이 꽉 참 → 새 행 삽입 필요`);
        canPlaceInExistingRows = false;
        break;
      }
    }

    if (canPlaceInExistingRows) {
      console.log('✅ 모든 필요 행에 공간 있음 → 기존 행에 배치 가능');
    } else {
      console.log('❌ 일부 필요 행이 꽉 참 → 새 행 생성 필요');
    }
  }

  // ===== STEP 6: 블록 배치 =====
  let movedBlock: BlockPosition;

  if (canPlaceInExistingRows) {
    // 빈 공간이 있으면 그 공간에 배치한 후 재분배
    console.log('✅ 빈 공간 발견: 목표 행에 배치 후 재분배');

    let emptyColStart = 0;
    if (finalDestinationRowBlocks.length > 0) {
      const lastBlock = finalDestinationRowBlocks[finalDestinationRowBlocks.length - 1];
      emptyColStart = lastBlock.colStart + lastBlock.colSpan;
    }

    // 기본 블록 생성 (재분배 전 임시 위치)
    movedBlock = {
      ...draggedBlock,
      row: destinationRow,
      colStart: emptyColStart,
      colSpan: 2 // 기본 크기로 배치 (재분배 시 자동 조정됨)
    };

    console.log('📦 블록 추가 후 재분배 실행:', {
      row: movedBlock.row,
      colStart: movedBlock.colStart,
      colSpan: movedBlock.colSpan
    });

    // 블록을 추가한 후 재분배
    const blocksWithNew = [...updatedBlocks, movedBlock];
    return redistributeRow(blocksWithNew, destinationRow, movedBlock);
  } else {
    // 목표 행이 꽉 차있으면 새 행 생성
    // 멀티행 블록의 경우 차지하는 행 수만큼 밀어내야 함
    console.log(`🔽 목표 행 꽉 참: ${draggedBlockRows}행만큼 새 행 생성`);

    updatedBlocks = updatedBlocks.map(b => {
      if (b.row >= destinationRow) {
        return { ...b, row: b.row + draggedBlockRows };
      }
      return b;
    });

    movedBlock = {
      ...draggedBlock,
      row: destinationRow,
      colStart: 0,
      colSpan: GRID_COLS
    };

    console.log('✅ 새 블록 위치 (새 행):', {
      row: movedBlock.row,
      colStart: movedBlock.colStart,
      colSpan: movedBlock.colSpan,
      rowsOccupied: draggedBlockRows
    });

    return [...updatedBlocks, movedBlock];
  }
};
