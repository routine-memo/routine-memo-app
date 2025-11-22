import { BlockPosition } from './types';
import { getRowBlocks } from './blockUtils';

const GRID_COLS = 6; // 전체 열 개수

// 가로 리사이즈 (열 단위로 "먹기")
export const handleWidthResize = (
  block: BlockPosition,
  direction: 'increase' | 'decrease',
  blockPositions: BlockPosition[]
): BlockPosition[] | null => {
  const rowBlocks = getRowBlocks(blockPositions, block.row);
  const blockIndex = rowBlocks.findIndex(b => b.id === block.id);

  if (blockIndex === -1) return null;

  if (direction === 'increase') {
    // 오른쪽 블록의 열을 1개 빼앗기
    const rightBlock = rowBlocks[blockIndex + 1];
    if (!rightBlock) return null; // 오른쪽 블록이 없으면 증가 불가

    // 오른쪽 블록이 최소 크기(1열)보다 크면 가능
    if (rightBlock.colSpan <= 1) return null;

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
    if (block.colSpan <= 1) return null; // 최소 크기면 감소 불가

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
  const currentRows = Math.ceil((block.height || 120) / 120);

  console.log(`📏 세로 리사이즈: ${direction}, 블록 ${blockId}, 현재 ${currentRows}개 행 차지`);

  if (direction === 'increase') {
    // 1. 새로운 행 번호 계산 (현재 블록 바로 아래)
    const newRowToEat = block.row + currentRows;
    console.log(`🍽️ ${newRowToEat}행을 먹으려고 시도`);

    // 2. 그 행에 열이 겹치는 블록이 있는지 확인
    const blockColEnd = block.colStart + block.colSpan;
    const blocksInNewRow = blockPositions.filter(b => {
      // 블록이 차지하는 행 범위 계산
      const bRows = Math.ceil((b.height || 120) / 120);
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
      const affectedBlockIds = new Set(overlappingBlocks.map(b => b.id));

      updatedBlocks = blockPositions.map(b => {
        if (affectedBlockIds.has(b.id)) {
          console.log(`  블록 ${b.id}: ${b.row}행 → ${b.row + 1}행`);
          return { ...b, row: b.row + 1 };
        }
        return b;
      });
    }

    // 4. 현재 블록이 새 행을 먹음 (높이를 120px 증가)
    const newHeight = (currentRows + 1) * 120;
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

    // 1. 새로운 행 수 계산
    const newRows = currentRows - 1;
    const newHeight = newRows * 120;

    console.log(`📉 블록 ${blockId} 높이 감소: ${block.height}px → ${newHeight}px (${currentRows}행 → ${newRows}행)`);

    // 2. 밀려난 블록 중 복귀할 블록 찾기
    const freedRow = block.row + newRows; // 방금 자유로워진 행
    const blockColEnd = block.colStart + block.colSpan;

    // 방금 자유로워진 행 바로 아래에 있는 블록들 중 열이 겹치는 것들 찾기
    const blocksToReturn = blockPositions.filter(b => {
      if (b.id === blockId) return false;
      if (b.row !== freedRow + 1) return false; // 바로 아래 행에 있는 블록만

      const bColEnd = b.colStart + b.colSpan;
      return block.colStart < bColEnd && blockColEnd > b.colStart;
    });

    console.log(`⬆️ ${freedRow + 1}행에서 ${freedRow}행으로 복귀할 블록:`, blocksToReturn.map(b => b.id));

    // 3. 블록들을 위로 올리고 현재 블록 높이 줄이기
    const returningBlockIds = new Set(blocksToReturn.map(b => b.id));

    return blockPositions.map(b => {
      if (b.id === blockId) {
        return { ...b, height: newHeight };
      }
      if (returningBlockIds.has(b.id)) {
        console.log(`  블록 ${b.id}: ${b.row}행 → ${b.row - 1}행`);
        return { ...b, row: b.row - 1 };
      }
      return b;
    });
  }
};
