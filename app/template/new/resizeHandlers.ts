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

// 높이 리사이즈 (다른 행을 "먹기")
export const handleHeightResize = (
  blockId: string,
  newHeight: number,
  blockPositions: BlockPosition[]
): BlockPosition[] => {
  const MIN_HEIGHT = 80;
  const ROW_HEIGHT_UNIT = 140; // 한 행을 먹는 기준 높이 (120px 블록 + 20px gap)

  const block = blockPositions.find(b => b.id === blockId);
  if (!block) return blockPositions;

  const finalHeight = Math.max(MIN_HEIGHT, newHeight);

  // 몇 개의 행을 차지할지 계산
  const rowsToOccupy = Math.ceil(finalHeight / ROW_HEIGHT_UNIT);

  if (rowsToOccupy <= 1) {
    // 1개 행만 차지 - 그냥 높이만 변경
    return blockPositions.map(b =>
      b.id === blockId ? { ...b, height: finalHeight } : b
    );
  }

  // 여러 행을 차지하는 경우
  const rowsToEat = rowsToOccupy - 1; // 추가로 먹을 행 개수
  const maxRowToEat = block.row + rowsToEat; // 마지막으로 먹을 행 번호

  console.log(`📏 세로 리사이즈: ${block.row}행 블록이 ${rowsToOccupy}개 행 차지 (높이: ${finalHeight}px)`);

  // 먹힐 행들의 블록들 찾기
  const affectedRows: number[] = [];
  for (let r = block.row + 1; r <= maxRowToEat; r++) {
    affectedRows.push(r);
  }

  console.log('🍴 먹힐 행들:', affectedRows);

  // 먹힐 행의 블록들 중 현재 블록과 겹치는 열을 가진 블록들 찾기
  const blockColEnd = block.colStart + block.colSpan;

  return blockPositions.map(b => {
    // 리사이즈 대상 블록: 높이만 변경
    if (b.id === blockId) {
      return { ...b, height: finalHeight };
    }

    // 먹힐 행에 있는 블록들 - 행은 유지하고 열만 조정
    if (affectedRows.includes(b.row)) {
      const bColEnd = b.colStart + b.colSpan;

      // 현재 블록과 열이 겹치는지 확인
      const isOverlapping = block.colStart < bColEnd && blockColEnd > b.colStart;

      if (isOverlapping) {
        console.log(`🔻 블록 ${b.id} (${b.row}행) 열 크기 축소 - 행은 유지`);

        // 새 시작 위치와 크기 계산
        let newColStart = b.colStart;
        let newColSpan = b.colSpan;

        // 완전히 겹치면 오른쪽으로 이동
        if (b.colStart >= block.colStart && bColEnd <= blockColEnd) {
          // 완전히 겹침 - 오른쪽으로 이동하고 원래 크기 유지
          newColStart = blockColEnd;
          newColSpan = Math.min(b.colSpan, GRID_COLS - blockColEnd);
        } else if (b.colStart < block.colStart && bColEnd > blockColEnd) {
          // 블록이 양쪽으로 넘어감 - 왼쪽 부분만 유지
          newColStart = b.colStart;
          newColSpan = block.colStart - b.colStart;
        } else if (b.colStart < block.colStart) {
          // 왼쪽에 걸침 - 겹치는 부분만큼 줄임
          newColStart = b.colStart;
          newColSpan = block.colStart - b.colStart;
        } else {
          // 오른쪽에 걸침 - 오른쪽으로 밀고 원래 크기 유지
          newColStart = blockColEnd;
          newColSpan = Math.min(b.colSpan, GRID_COLS - blockColEnd);
        }

        // 최소 크기 보장
        newColSpan = Math.max(1, newColSpan);

        // 범위 체크
        if (newColStart < 0) newColStart = 0;
        if (newColStart + newColSpan > GRID_COLS) {
          newColSpan = GRID_COLS - newColStart;
        }

        return {
          ...b,
          colStart: newColStart,
          colSpan: newColSpan
          // row는 그대로 유지 (행 번호 변경 없음!)
        };
      }
    }

    return b;
  });
};
