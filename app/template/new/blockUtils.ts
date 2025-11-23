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
  insertedBlock: BlockPosition
): BlockPosition[] => {
  const rowBlocks = getRowBlocks(blocks, row);
  const totalSpan = getTotalColSpan(rowBlocks);

  // 이미 꽉 찼으면 재정렬 불필요
  if (totalSpan === GRID_COLS) {
    return blocks;
  }

  // 남은 공간 계산
  const remainingCols = GRID_COLS - totalSpan;

  // 남은 공간을 블록들에게 균등 분배
  const blocksToExpand = rowBlocks.length;
  const colsPerBlock = Math.floor(remainingCols / blocksToExpand);
  const remainder = remainingCols % blocksToExpand;

  let updatedBlocks = [...blocks];
  let currentColStart = 0;

  rowBlocks.forEach((block, index) => {
    const extraSpan = colsPerBlock + (index < remainder ? 1 : 0);
    updatedBlocks = updatedBlocks.map(b => {
      if (b.id === block.id) {
        const newBlock = {
          ...b,
          colStart: currentColStart,
          colSpan: b.colSpan + extraSpan
        };
        currentColStart += newBlock.colSpan;
        return newBlock;
      }
      return b;
    });
  });

  return updatedBlocks;
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
    console.log('✅ 재분배 결과:', finalOrder.map(b => ({ id: b.id, colStart: b.colStart, colSpan: b.colSpan })));
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
  position: 'left' | 'right'
): BlockPosition[] | null => {
  console.log('🔀 moveBlockToRowSide:', {
    draggedId: draggedBlock.id,
    targetId: targetBlock.id,
    position,
    targetRow: targetBlock.row
  });

  // 1. 드래그한 블록을 원래 행에서 제거
  let updatedBlocks = blocks.filter(b => b.id !== draggedBlock.id);

  // 2. 원래 행의 블록들 재정렬
  const originalRowBlocks = getRowBlocks(updatedBlocks, draggedBlock.row);
  let adjustedTargetRow = targetBlock.row;

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
    if (targetBlock.row > draggedBlock.row) {
      adjustedTargetRow = targetBlock.row - 1;
      console.log('📍 타겟 행 조정:', targetBlock.row, '→', adjustedTargetRow);
    }
  }

  // 3. 타겟 행의 블록들 가져오기
  const targetRowBlocks = getRowBlocks(updatedBlocks, adjustedTargetRow);
  const targetIndex = targetRowBlocks.findIndex(b => b.id === targetBlock.id);

  if (targetIndex === -1) return null;

  // 한 행에 최대 3개까지만 허용
  if (targetRowBlocks.length >= 3) {
    console.log('❌ 타겟 행이 이미 꽉 참 (3개)');
    return null;
  }

  // 4. 새로운 순서로 블록 배치
  let newOrder: BlockPosition[];
  if (position === 'left') {
    newOrder = [
      ...targetRowBlocks.slice(0, targetIndex),
      { ...draggedBlock, row: adjustedTargetRow },
      ...targetRowBlocks.slice(targetIndex)
    ];
  } else {
    newOrder = [
      ...targetRowBlocks.slice(0, targetIndex + 1),
      { ...draggedBlock, row: adjustedTargetRow },
      ...targetRowBlocks.slice(targetIndex + 1)
    ];
  }

  console.log('📋 새 순서:', newOrder.map(b => b.id));

  // 5. 열 균등 분배
  const avgColSpan = Math.floor(GRID_COLS / newOrder.length);
  const remainder = GRID_COLS % newOrder.length;

  let currentColStart = 0;
  const finalOrder = newOrder.map((block, index) => {
    const colSpan = avgColSpan + (index < remainder ? 1 : 0);
    const updated = {
      ...block,
      colStart: currentColStart,
      colSpan: colSpan
    };
    currentColStart += colSpan;
    return updated;
  });

  console.log('✅ 재분배 결과:', finalOrder.map(b => ({ id: b.id, colStart: b.colStart, colSpan: b.colSpan })));

  // 6. 전체 블록 배열에 적용
  const result = updatedBlocks.map(b => {
    if (b.row !== adjustedTargetRow) return b;
    const updated = finalOrder.find(ub => ub.id === b.id);
    return updated || b;
  });

  // 7. 드래그한 블록이 결과에 없으면 추가 (새로운 행에 들어간 경우)
  const draggedBlockInResult = result.find(b => b.id === draggedBlock.id);
  if (!draggedBlockInResult) {
    const draggedInFinalOrder = finalOrder.find(b => b.id === draggedBlock.id);
    if (draggedInFinalOrder) {
      result.push(draggedInFinalOrder);
    }
  }

  console.log('🎯 최종 결과:', result.length, '개 블록');
  return result;
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

  // ===== STEP 2: 목표 행의 현재 상태 파악 (블록 제거 전) =====
  // 드래그 블록을 제외한 상태로 목표 행의 블록들 확인
  const blocksExcludingDragged = blocks.filter(b => b.id !== draggedBlock.id);
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

  // ===== STEP 3: 드래그한 블록 제거 및 원래 행 정리 =====
  let updatedBlocks = blocksExcludingDragged;

  // 원래 행이 비어있는지 확인
  const originalRowBlocks = getRowBlocks(updatedBlocks, draggedBlock.row);

  if (originalRowBlocks.length === 0) {
    // 원래 행이 비었으면 아래 행들을 올림
    const needsRowShift = draggedBlock.row < destinationRow;

    if (needsRowShift) {
      updatedBlocks = updatedBlocks.map(b => {
        if (b.row > draggedBlock.row) {
          return { ...b, row: b.row - 1 };
        }
        return b;
      });
      // 목표 행도 조정
      destinationRow = destinationRow - 1;
      console.log('📍 빈 행 제거로 목표 행 조정:', destinationRow);
    }
  } else if (draggedBlock.row !== targetBlock.row) {
    // 원래 행에 다른 블록들이 있고, 타겟과 다른 행이면 재정렬
    updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);
    console.log('🔄 원래 행 재정렬 완료');
  }

  // ===== STEP 4: 목표 행의 최종 상태 재확인 =====
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

  // ===== STEP 5: 블록 배치 =====
  let movedBlock: BlockPosition;

  if (finalAvailableCols > 0) {
    // 빈 공간이 있으면 그 공간에 배치
    console.log('✅ 빈 공간 발견: 목표 행에 배치');

    let emptyColStart = 0;
    if (finalDestinationRowBlocks.length > 0) {
      const lastBlock = finalDestinationRowBlocks[finalDestinationRowBlocks.length - 1];
      emptyColStart = lastBlock.colStart + lastBlock.colSpan;
    }

    movedBlock = {
      ...draggedBlock,
      row: destinationRow,
      colStart: emptyColStart,
      colSpan: finalAvailableCols
    };

    console.log('✅ 새 블록 위치 (빈 공간):', {
      row: movedBlock.row,
      colStart: movedBlock.colStart,
      colSpan: movedBlock.colSpan
    });

    return [...updatedBlocks, movedBlock];
  } else {
    // 목표 행이 꽉 차있으면 새 행 생성
    console.log('🔽 목표 행 꽉 참: 새 행 생성');

    updatedBlocks = updatedBlocks.map(b => {
      if (b.row >= destinationRow) {
        return { ...b, row: b.row + 1 };
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
      colSpan: movedBlock.colSpan
    });

    return [...updatedBlocks, movedBlock];
  }
};
