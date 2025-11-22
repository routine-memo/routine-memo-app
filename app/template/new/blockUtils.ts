import { BlockPosition } from './types';

const GRID_COLS = 6; // 전체 열 개수

// 특정 행의 블록들 가져오기
export const getRowBlocks = (blockPositions: BlockPosition[], row: number): BlockPosition[] => {
  return blockPositions
    .filter(b => b.row === row)
    .sort((a, b) => a.colStart - b.colStart);
};

// 전체 행 배열 생성
export const getAllRows = (blockPositions: BlockPosition[]): number[] => {
  if (blockPositions.length === 0) return [];
  const maxRow = Math.max(...blockPositions.map(b => b.row));
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

  // 드래그한 블록을 원래 행에서 제거
  let updatedBlocks = blocks.filter(b => b.id !== draggedBlock.id);

  // 원래 행의 블록들 재정렬
  const originalRowBlocks = getRowBlocks(updatedBlocks, draggedBlock.row);
  let rowShiftAmount = 0;

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

    // 타겟이 드래그한 블록 아래에 있었으면 행이 1칸 올라감
    if (targetBlock.row > draggedBlock.row) {
      rowShiftAmount = 1;
    }
  }

  // 조정된 타겟 블록 찾기
  const adjustedTargetBlock = updatedBlocks.find(b => b.id === targetBlock.id) || targetBlock;

  console.log('🔍 타겟 블록 조정 전후:', {
    original: { id: targetBlock.id, row: targetBlock.row, height: targetBlock.height },
    adjusted: { id: adjustedTargetBlock.id, row: adjustedTargetBlock.row, height: adjustedTargetBlock.height },
    found: updatedBlocks.find(b => b.id === targetBlock.id) ? 'YES' : 'NO'
  });

  // 새 행 계산
  let newRow: number;

  if (position === 'above') {
    // above: 타겟 블록이 시작하는 행
    newRow = adjustedTargetBlock.row;
  } else {
    // below: 타겟 블록의 열 범위에서 비어있는 가장 가까운 행 찾기
    const targetColStart = adjustedTargetBlock.colStart;
    const targetColEnd = adjustedTargetBlock.colStart + adjustedTargetBlock.colSpan;

    // 타겟 블록의 행부터 시작해서 비어있는 행 찾기
    let candidateRow = adjustedTargetBlock.row + 1;

    // 해당 열 범위에 블록이 있는지 확인하는 함수
    const hasBlockInColumnRange = (row: number): boolean => {
      return updatedBlocks.some(b => {
        // 블록이 차지하는 행 범위 계산
        const blockRows = Math.ceil(b.height / 140);
        const blockStartRow = b.row;
        const blockEndRow = b.row + blockRows - 1;

        // 체크하려는 행이 블록의 행 범위에 포함되는지 확인
        if (row < blockStartRow || row > blockEndRow) return false;

        const bColEnd = b.colStart + b.colSpan;
        // 열이 겹치는지 확인
        return targetColStart < bColEnd && targetColEnd > b.colStart;
      });
    };

    // 비어있는 행을 찾을 때까지 계속 확인
    const maxRow = updatedBlocks.length > 0 ? Math.max(...updatedBlocks.map(b => b.row)) : -1;
    while (candidateRow <= maxRow + 1 && hasBlockInColumnRange(candidateRow)) {
      candidateRow++;
    }

    newRow = candidateRow;
  }

  // 빈 행을 찾았는지 확인 (블록의 높이를 고려하여 실제 차지하는 마지막 행 계산)
  const maxExistingRow = updatedBlocks.length > 0
    ? Math.max(...updatedBlocks.map(b => {
        const blockRows = Math.ceil(b.height / 140);
        return b.row + blockRows - 1; // 블록이 차지하는 마지막 행
      }))
    : -1;
  const foundEmptyRow = newRow <= maxExistingRow;

  console.log('📍 조정된 값:', {
    rowShiftAmount,
    adjustedTargetRow: adjustedTargetBlock.row,
    targetBlockHeight: adjustedTargetBlock.height,
    targetColStart: adjustedTargetBlock.colStart,
    targetColEnd: adjustedTargetBlock.colStart + adjustedTargetBlock.colSpan,
    candidateRow: newRow,
    maxExistingRow,
    foundEmptyRow: foundEmptyRow ? 'YES (기존 빈 공간)' : 'NO (새 행 생성)',
    position
  });

  // 빈 행이 없을 때만 아래 행들을 밀기
  // 빈 행을 찾았으면 그 자리에 바로 배치
  if (!foundEmptyRow) {
    console.log('🔽 새 행 삽입: 기존 행들을 아래로 밀기');
    updatedBlocks = updatedBlocks.map(b => {
      if (b.row >= newRow) {
        return { ...b, row: b.row + 1 };
      }
      return b;
    });
  } else {
    console.log('✅ 빈 공간 발견: 행을 밀지 않고 바로 배치');
  }

  // 드래그한 블록을 새 행에 추가 - 조정된 타겟 블록과 같은 열 위치와 크기
  const movedBlock: BlockPosition = {
    ...draggedBlock,
    row: newRow,
    colStart: adjustedTargetBlock.colStart,
    colSpan: adjustedTargetBlock.colSpan
  };

  console.log('✅ 새 블록 위치:', {
    row: movedBlock.row,
    colStart: movedBlock.colStart,
    colSpan: movedBlock.colSpan
  });

  return [...updatedBlocks, movedBlock];
};
