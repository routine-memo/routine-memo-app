import { BlockPosition } from './types';
import { getRowBlocks } from './blockUtils';

const GRID_COLS = 6; // 전체 열 개수
const ROW_HEIGHT = 120; // 각 행의 높이 (px)
const ROW_GAP = 12; // 행 사이 간격 (gap-3 = 12px)

// 행 수로부터 실제 블록 높이 계산 (gap 포함)
const calculateHeight = (rows: number): number => {
  return rows * ROW_HEIGHT + (rows - 1) * ROW_GAP;
};

// 블록 높이로부터 차지하는 행 수 계산
const calculateRows = (height: number): number => {
  // height = rows * 120 + (rows - 1) * 12
  // height = rows * 120 + rows * 12 - 12
  // height = rows * 132 - 12
  // rows = (height + 12) / 132
  return Math.ceil((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP));
};

// 가로 리사이즈 (열 단위로 "먹기")
export const handleWidthResize = (
  block: BlockPosition,
  direction: 'increase' | 'decrease',
  blockPositions: BlockPosition[],
  side: 'left' | 'right' = 'right' // 어느 쪽을 드래그했는지
): BlockPosition[] | null => {
  const rowBlocks = getRowBlocks(blockPositions, block.row);
  const blockIndex = rowBlocks.findIndex(b => b.id === block.id);

  if (blockIndex === -1) return null;

  // 왼쪽 리사이즈
  if (side === 'left') {
    if (direction === 'increase') {
      // 왼쪽 블록의 열을 1개 빼앗기
      const leftBlock = rowBlocks[blockIndex - 1];
      if (!leftBlock) return null; // 왼쪽 블록이 없으면 증가 불가

      // 왼쪽 블록이 최소 크기(2열)보다 크면 가능
      if (leftBlock.colSpan <= 2) return null;

      return blockPositions.map(b => {
        if (b.id === block.id) {
          return { ...b, colStart: b.colStart - 1, colSpan: b.colSpan + 1 };
        }
        if (b.id === leftBlock.id) {
          return { ...b, colSpan: b.colSpan - 1 };
        }
        return b;
      });
    } else {
      // decrease: 현재 블록의 왼쪽 열을 1개 줄이고 왼쪽 블록에게 주기
      if (block.colSpan <= 2) return null; // 최소 크기면 감소 불가

      const leftBlock = rowBlocks[blockIndex - 1];
      if (!leftBlock) return null; // 왼쪽 블록이 없으면 감소 불가

      return blockPositions.map(b => {
        if (b.id === block.id) {
          return { ...b, colStart: b.colStart + 1, colSpan: b.colSpan - 1 };
        }
        if (b.id === leftBlock.id) {
          return { ...b, colSpan: b.colSpan + 1 };
        }
        return b;
      });
    }
  }
  // 오른쪽 리사이즈 (기존 로직)
  else {
    if (direction === 'increase') {
      // 오른쪽 블록의 열을 1개 빼앗기
      const rightBlock = rowBlocks[blockIndex + 1];
      if (!rightBlock) return null; // 오른쪽 블록이 없으면 증가 불가

      // 오른쪽 블록이 최소 크기(2열)보다 크면 가능
      if (rightBlock.colSpan <= 2) return null;

      return blockPositions.map(b => {
        if (b.id === block.id) {
          return { ...b, colSpan: b.colSpan + 1 };
        }
        if (b.id === rightBlock.id) {
          return { ...b, colStart: b.colStart + 1, colSpan: b.colSpan - 1 };
        }
        return b;
      });
    } else {
      // decrease: 현재 블록의 열을 1개 줄이고 오른쪽 블록에게 주기
      if (block.colSpan <= 2) return null; // 최소 크기면 감소 불가

      const rightBlock = rowBlocks[blockIndex + 1];
      if (!rightBlock) return null; // 오른쪽 블록이 없으면 감소 불가

      return blockPositions.map(b => {
        if (b.id === block.id) {
          return { ...b, colSpan: b.colSpan - 1 };
        }
        if (b.id === rightBlock.id) {
          return { ...b, colStart: b.colStart - 1, colSpan: b.colSpan + 1 };
        }
        return b;
      });
    }
  }
};

// 높이 리사이즈 (다른 행을 "먹기") - 행을 먹는 방식으로 동작
export const handleHeightResize = (
  blockId: string,
  direction: 'increase' | 'decrease',
  blockPositions: BlockPosition[]
): BlockPosition[] | null => {
  const block = blockPositions.find(b => b.id === blockId);
  if (!block) return null;

  // 블록이 현재 차지하는 행 수 계산
  const currentRows = calculateRows(block.height || ROW_HEIGHT);

  console.log(`📏 세로 리사이즈: ${direction}, 블록 ${blockId}, 현재 ${currentRows}개 행 차지 (높이: ${block.height}px)`);

  if (direction === 'increase') {
    // 1. 새로운 행 번호 계산 (현재 블록 바로 아래)
    const newRowToEat = block.row + currentRows;
    console.log(`🍽️ ${newRowToEat}행을 먹으려고 시도`);

    // 2. 그 행에 열이 겹치는 블록이 있는지 확인
    const blockColEnd = block.colStart + block.colSpan;
    const blocksInNewRow = blockPositions.filter(b => {
      // 블록이 차지하는 행 범위 계산
      const bRows = calculateRows(b.height || ROW_HEIGHT);
      const bStartRow = b.row;
      const bEndRow = b.row + bRows - 1;

      // newRowToEat이 블록의 행 범위에 포함되는지 확인
      return newRowToEat >= bStartRow && newRowToEat <= bEndRow;
    });

    const overlappingBlocks = blocksInNewRow.filter(b => {
      const bColEnd = b.colStart + b.colSpan;
      return block.colStart < bColEnd && blockColEnd > b.colStart;
    });

    console.log(`🔍 ${newRowToEat}행의 겹치는 블록:`, overlappingBlocks.map(b => b.id));

    // 3. 겹치는 블록들을 아래로 밀기
    let updatedBlocks = blockPositions;
    if (overlappingBlocks.length > 0) {
      console.log('🔻 겹치는 블록들을 아래로 밀기');

      // 겹치는 블록 중 가장 위에서 시작하는 블록 찾기
      const topMostRow = Math.min(...overlappingBlocks.map(b => b.row));
      console.log(`  가장 위 블록의 시작 행: ${topMostRow}`);

      // topMostRow부터 아래에 있는 모든 블록을 1행씩 밀기
      updatedBlocks = blockPositions.map(b => {
        if (b.id === blockId) return b; // 리사이즈하는 블록은 제외

        if (b.row >= topMostRow) {
          console.log(`  블록 ${b.id}: ${b.row}행 → ${b.row + 1}행`);
          return { ...b, row: b.row + 1 };
        }
        return b;
      });
    }

    // 4. 현재 블록이 새 행을 먹음 (gap 포함하여 높이 계산)
    const newHeight = calculateHeight(currentRows + 1);
    console.log(`📈 블록 ${blockId} 높이 증가: ${block.height}px → ${newHeight}px (${currentRows}행 → ${currentRows + 1}행)`);

    return updatedBlocks.map(b =>
      b.id === blockId ? { ...b, height: newHeight } : b
    );

  } else {
    // decrease: 블록이 차지하는 행 1개 줄이기
    if (currentRows <= 1) {
      console.log('❌ 1개 행만 차지 - 감소 불가');
      return null;
    }

    // 1. 새로운 행 수 계산 (gap 포함)
    const newRows = currentRows - 1;
    const newHeight = calculateHeight(newRows);

    console.log(`📉 블록 ${blockId} 높이 감소: ${block.height}px → ${newHeight}px (${currentRows}행 → ${newRows}행)`);

    // 2. 자유로워진 행 찾기
    const freedRow = block.row + newRows; // 방금 자유로워진 행
    const blockColEnd = block.colStart + block.colSpan;

    console.log(`🆓 자유로워진 행: ${freedRow}`);

    // 3. freedRow보다 아래에 있는 모든 블록들을 1행씩 올리기
    // (이전에 increase로 밀려난 블록들이 복귀)
    return blockPositions.map(b => {
      if (b.id === blockId) {
        return { ...b, height: newHeight };
      }

      // freedRow보다 아래에 있는 블록은 1행 위로
      if (b.row > freedRow) {
        console.log(`  블록 ${b.id}: ${b.row}행 → ${b.row - 1}행`);
        return { ...b, row: b.row - 1 };
      }

      return b;
    });
  }
};
