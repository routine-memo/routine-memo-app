import { BlockPosition } from './types';

// 가로 넓이 조정 로직
export const handleWidthResize = (
  block: BlockPosition,
  newWidth: number,
  blockPositions: BlockPosition[],
  containerWidth: number
): BlockPosition[] | null => {
  // 같은 행에서 y=0인 블록들만 (가로 배치된 블록들)
  const horizontalBlocks = blockPositions
    .filter(b => b.row === block.row && b.y === 0)
    .sort((a, b) => a.x - b.x);

  // 리사이즈하려는 블록이 세로 스택(y>0)이면 y=0인 블록 찾기
  let targetBlock = block;
  if (block.y > 0) {
    const baseBlock = blockPositions.find(
      b => b.row === block.row && b.x === block.x && b.width === block.width && b.y === 0
    );
    if (!baseBlock) return null; // y=0인 기준 블록이 없으면 리사이즈 불가
    targetBlock = baseBlock;
  }

  const blockIndex = horizontalBlocks.findIndex(b => b.id === targetBlock.id);

  if (blockIndex === -1) return null;

  const widthDelta = newWidth - targetBlock.width;
  const minBlockWidth = 50;

  if (widthDelta > 0) {
    // 넓이 증가
    return handleWidthIncrease(
      targetBlock,
      newWidth,
      widthDelta,
      minBlockWidth,
      blockPositions,
      containerWidth,
      horizontalBlocks,
      blockIndex
    );
  } else if (widthDelta < 0) {
    // 넓이 감소
    return handleWidthDecrease(
      targetBlock,
      newWidth,
      widthDelta,
      minBlockWidth,
      blockPositions,
      horizontalBlocks,
      blockIndex
    );
  }

  return null;
};

// 넓이 증가 처리
function handleWidthIncrease(
  targetBlock: BlockPosition,
  newWidth: number,
  widthDelta: number,
  minBlockWidth: number,
  blockPositions: BlockPosition[],
  containerWidth: number,
  horizontalBlocks: BlockPosition[],
  blockIndex: number
): BlockPosition[] {
  const rightBlocks = horizontalBlocks.slice(blockIndex + 1);

  if (rightBlocks.length > 0) {
    // 오른쪽 블록이 있으면 첫 번째 블록의 넓이를 줄임
    const firstRightBlock = rightBlocks[0];
    const newRightWidth = firstRightBlock.width - widthDelta;

    if (newRightWidth >= minBlockWidth) {
      // 오른쪽 블록을 줄일 수 있음
      const updatedBlocks = blockPositions.map(b => {
        // targetBlock과 같은 x, width를 가진 블록들 (세로 스택) 모두 조정
        if (b.row === targetBlock.row && b.x === targetBlock.x && b.width === targetBlock.width) {
          return { ...b, width: newWidth };
        }
        if (b.id === firstRightBlock.id) {
          return { ...b, x: b.x + widthDelta, width: newRightWidth };
        }
        // 오른쪽 블록과 같은 x, width를 가진 블록들도 함께 조정
        if (b.row === targetBlock.row && b.x === firstRightBlock.x && b.width === firstRightBlock.width) {
          return { ...b, x: b.x + widthDelta, width: newRightWidth };
        }
        return b;
      });
      return updatedBlocks;
    }
  } else {
    // 오른쪽에 블록이 없으면 컨테이너 너비 내에서 자유롭게 증가
    const maxWidth = containerWidth - targetBlock.x;
    const finalWidth = Math.min(newWidth, maxWidth);
    const updatedBlocks = blockPositions.map(b => {
      if (b.row === targetBlock.row && b.x === targetBlock.x && b.width === targetBlock.width) {
        return { ...b, width: finalWidth };
      }
      return b;
    });
    return updatedBlocks;
  }

  return blockPositions;
}

// 넓이 감소 처리
function handleWidthDecrease(
  targetBlock: BlockPosition,
  newWidth: number,
  widthDelta: number,
  minBlockWidth: number,
  blockPositions: BlockPosition[],
  horizontalBlocks: BlockPosition[],
  blockIndex: number
): BlockPosition[] {
  if (newWidth >= minBlockWidth) {
    const rightBlocks = horizontalBlocks.slice(blockIndex + 1);

    if (rightBlocks.length > 0) {
      // 오른쪽 블록이 있으면 그 블록의 너비를 늘림
      const firstRightBlock = rightBlocks[0];
      const updatedBlocks = blockPositions.map(b => {
        // targetBlock과 같은 x, width를 가진 블록들 (세로 스택) 모두 조정
        if (b.row === targetBlock.row && b.x === targetBlock.x && b.width === targetBlock.width) {
          return { ...b, width: newWidth };
        }
        if (b.id === firstRightBlock.id) {
          return { ...b, x: b.x + widthDelta, width: b.width - widthDelta };
        }
        // 오른쪽 블록과 같은 x, width를 가진 블록들도 함께 조정
        if (b.row === targetBlock.row && b.x === firstRightBlock.x && b.width === firstRightBlock.width) {
          return { ...b, x: b.x + widthDelta, width: b.width - widthDelta };
        }
        return b;
      });
      return updatedBlocks;
    } else {
      // 오른쪽에 블록이 없으면 그냥 줄임
      const updatedBlocks = blockPositions.map(b => {
        if (b.row === targetBlock.row && b.x === targetBlock.x && b.width === targetBlock.width) {
          return { ...b, width: newWidth };
        }
        return b;
      });
      return updatedBlocks;
    }
  }

  return blockPositions;
}

// 높이 조정 로직
export const handleHeightResize = (
  blockId: string,
  newHeight: number,
  blockPositions: BlockPosition[]
): BlockPosition[] => {
  return blockPositions.map(b =>
    b.id === blockId ? { ...b, height: newHeight } : b
  );
};
