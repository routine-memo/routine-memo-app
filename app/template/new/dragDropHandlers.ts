import { BlockPosition, DropTarget } from './types';
import { canPlaceBlock, compactLayout } from './blockUtils';

export const handleDrop = (
  draggedBlock: BlockPosition | null,
  dropTarget: DropTarget | null,
  targetBlock: BlockPosition,
  blockPositions: BlockPosition[],
  containerWidth: number
): BlockPosition[] | null => {
  if (!draggedBlock || !dropTarget || draggedBlock.id === targetBlock.id) {
    return null;
  }

  let updatedBlocks = blockPositions.filter(b => b.id !== draggedBlock.id);
  let newBlock: BlockPosition;

  const minBlockWidth = 70; // 최소 블록 너비 (3개까지 가능하도록: 70*3 + 12*2 = 234px)

  if (dropTarget.position === 'above') {
    // 위 배치: 타겟 블록과 같은 x, width를 가진 블록들을 y 좌표 기준으로 밀어내기
    const newY = 0; // 맨 위에 배치
    const pushDownAmount = draggedBlock.height + 12; // 밀어낼 높이

    // 타겟과 같은 x, width를 가진 블록들을 찾아서 아래로 밀기
    const sameColumnBlocks = updatedBlocks.filter(
      b => b.row === targetBlock.row && b.x === targetBlock.x && b.width === targetBlock.width
    );

    if (sameColumnBlocks.length > 0) {
      // 같은 열에 블록들이 있으면 모두 아래로 밀기
      updatedBlocks = updatedBlocks.map(block => {
        if (block.row === targetBlock.row && block.x === targetBlock.x && block.width === targetBlock.width) {
          return { ...block, y: block.y + pushDownAmount };
        }
        return block;
      });

      // 새 블록을 맨 위(y=0)에 배치
      newBlock = {
        id: draggedBlock.id,
        type: draggedBlock.type,
        row: targetBlock.row,
        x: targetBlock.x,
        y: newY,
        width: targetBlock.width,
        height: draggedBlock.height
      };
    } else {
      // 같은 열에 블록이 없으면 새 행 생성
      updatedBlocks = updatedBlocks.map(block => {
        if (block.row >= targetBlock.row) {
          return { ...block, row: block.row + 1 };
        }
        return block;
      });

      newBlock = {
        id: draggedBlock.id,
        type: draggedBlock.type,
        row: targetBlock.row,
        x: 0,
        y: 0,
        width: containerWidth,
        height: draggedBlock.height
      };
    }
  } else if (dropTarget.position === 'below') {
    // 아래 배치: 타겟 블록 바로 밑에 배치 시도 (같은 행, 같은 x/width)
    const newY = targetBlock.y + targetBlock.height + 12;

    // 타겟과 같은 x, width로 바로 밑에 배치 가능한지 확인
    if (canPlaceBlock(updatedBlocks, targetBlock.row, targetBlock.x, newY, targetBlock.width, draggedBlock.height, draggedBlock.id)) {
      newBlock = {
        id: draggedBlock.id,
        type: draggedBlock.type,
        row: targetBlock.row,
        x: targetBlock.x,
        y: newY,
        width: targetBlock.width,
        height: draggedBlock.height
      };
    } else {
      // 배치 불가능하면 새 행 생성
      updatedBlocks = updatedBlocks.map(block => {
        if (block.row > targetBlock.row) {
          return { ...block, row: block.row + 1 };
        }
        return block;
      });

      newBlock = {
        id: draggedBlock.id,
        type: draggedBlock.type,
        row: targetBlock.row + 1,
        x: 0,
        y: 0,
        width: containerWidth,
        height: draggedBlock.height
      };
    }
  } else {
    // 왼쪽/오른쪽 배치는 별도 함수로 분리
    const result = handleHorizontalDrop(
      draggedBlock,
      dropTarget,
      targetBlock,
      updatedBlocks,
      containerWidth,
      minBlockWidth
    );
    if (!result) return null;
    newBlock = result.newBlock;
    updatedBlocks = result.updatedBlocks;
  }

  // 드래그된 블록의 원래 행이 비었으면 아래 행들 올리기
  const originalRowBlocks = updatedBlocks.filter(b => b.row === draggedBlock.row);
  if (originalRowBlocks.length === 0) {
    updatedBlocks = updatedBlocks.map(block => {
      if (block.row > draggedBlock.row) {
        return { ...block, row: block.row - 1 };
      }
      return block;
    });
    if (newBlock.row > draggedBlock.row) {
      newBlock = { ...newBlock, row: newBlock.row - 1 };
    }
  }

  updatedBlocks.push(newBlock);

  // 레이아웃 재정렬: 빈 공간 제거
  const compactedBlocks = compactLayout(updatedBlocks);

  return compactedBlocks;
};

// 가로 방향 드롭 처리
function handleHorizontalDrop(
  draggedBlock: BlockPosition,
  dropTarget: DropTarget,
  targetBlock: BlockPosition,
  updatedBlocks: BlockPosition[],
  containerWidth: number,
  minBlockWidth: number
): { newBlock: BlockPosition; updatedBlocks: BlockPosition[] } | null {
  const rowBlocks = updatedBlocks.filter(b => b.row === targetBlock.row).sort((a, b) => a.x - b.x);
  const targetIndex = rowBlocks.findIndex(b => b.id === targetBlock.id);

  // 행의 실제 사용 가능한 공간 계산
  const totalUsedWidth = rowBlocks.reduce((sum, b) => sum + b.width + 12, 0) - 12;
  const availableSpace = containerWidth - totalUsedWidth;

  if (dropTarget.position === 'left') {
    return handleLeftDrop(draggedBlock, targetBlock, updatedBlocks, containerWidth, minBlockWidth, availableSpace, rowBlocks);
  } else {
    return handleRightDrop(draggedBlock, targetBlock, updatedBlocks, containerWidth, minBlockWidth, availableSpace, rowBlocks, targetIndex);
  }
}

// 왼쪽 드롭 처리
function handleLeftDrop(
  draggedBlock: BlockPosition,
  targetBlock: BlockPosition,
  updatedBlocks: BlockPosition[],
  containerWidth: number,
  minBlockWidth: number,
  availableSpace: number,
  rowBlocks: BlockPosition[]
): { newBlock: BlockPosition; updatedBlocks: BlockPosition[] } | null {
  const leftSpace = targetBlock.x;

  // 타겟 블록 아래에 세로로 쌓을 수 있는지 확인
  const sameXBlocks = rowBlocks.filter(b =>
    b.x === targetBlock.x && b.width === targetBlock.width
  ).sort((a, b) => a.y - b.y);
  const targetIndexInColumn = sameXBlocks.findIndex(b => b.id === targetBlock.id);
  const nextBlockInColumn = sameXBlocks[targetIndexInColumn + 1];
  const spaceBelow = nextBlockInColumn
    ? nextBlockInColumn.y - (targetBlock.y + targetBlock.height)
    : Infinity;

  if (leftSpace >= minBlockWidth + 12) {
    // 왼쪽에 공간이 있으면 거기에 배치
    const newBlockWidth = Math.min(leftSpace - 12, draggedBlock.width);
    const newX = targetBlock.x - newBlockWidth - 12;

    return {
      newBlock: { ...draggedBlock, row: targetBlock.row, x: newX, y: 0, width: newBlockWidth },
      updatedBlocks
    };
  } else if (targetBlock.width >= minBlockWidth + 12) {
    // 타겟 블록을 나눔
    const newBlockWidth = Math.max(minBlockWidth, Math.floor((targetBlock.width - 12) / 2));
    const remainingWidth = targetBlock.width - newBlockWidth - 12;

    if (remainingWidth >= minBlockWidth) {
      updatedBlocks = updatedBlocks.map(block => {
        if (block.id === targetBlock.id) {
          return { ...block, x: block.x + newBlockWidth + 12, width: remainingWidth, y: 0 };
        }
        if (block.row === targetBlock.row && block.x > targetBlock.x) {
          return { ...block, x: block.x + newBlockWidth + 12 };
        }
        return block;
      });

      return {
        newBlock: { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: 0, width: newBlockWidth },
        updatedBlocks
      };
    }
  } else if (spaceBelow >= draggedBlock.height + 12) {
    // 타겟 블록 아래에 세로로 쌓기
    const newY = targetBlock.y + targetBlock.height + 12;

    if (canPlaceBlock(updatedBlocks, targetBlock.row, targetBlock.x, newY, targetBlock.width, draggedBlock.height, draggedBlock.id)) {
      return {
        newBlock: { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: newY, width: targetBlock.width },
        updatedBlocks
      };
    }
  } else if (availableSpace >= minBlockWidth) {
    // 행 끝 여유 공간 활용
    const spaceForNewBlock = Math.min(Math.floor(targetBlock.width / 2), availableSpace);
    if (spaceForNewBlock >= minBlockWidth) {
      updatedBlocks = updatedBlocks.map(block => {
        if (block.id === targetBlock.id) {
          return { ...block, x: block.x + spaceForNewBlock + 12, width: block.width - spaceForNewBlock - 12 };
        }
        if (block.row === targetBlock.row && block.x > targetBlock.x) {
          return { ...block, x: block.x + spaceForNewBlock + 12 };
        }
        return block;
      });
      return {
        newBlock: { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: 0, width: spaceForNewBlock },
        updatedBlocks
      };
    }
  }

  // 새 행 생성
  updatedBlocks = updatedBlocks.map(block => {
    if (block.row > targetBlock.row) {
      return { ...block, row: block.row + 1 };
    }
    return block;
  });
  return {
    newBlock: { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth },
    updatedBlocks
  };
}

// 오른쪽 드롭 처리 (별도 파일로 분리 가능)
function handleRightDrop(
  draggedBlock: BlockPosition,
  targetBlock: BlockPosition,
  updatedBlocks: BlockPosition[],
  containerWidth: number,
  minBlockWidth: number,
  availableSpace: number,
  rowBlocks: BlockPosition[],
  targetIndex: number
): { newBlock: BlockPosition; updatedBlocks: BlockPosition[] } | null {
  const rightEdge = targetBlock.x + targetBlock.width;
  const nextBlock = rowBlocks[targetIndex + 1];
  const rightSpace = nextBlock ? nextBlock.x - rightEdge - 12 : containerWidth - rightEdge;

  const sameXBlocks = rowBlocks.filter(b =>
    b.x === targetBlock.x && b.width === targetBlock.width
  ).sort((a, b) => a.y - b.y);
  const targetIndexInColumn = sameXBlocks.findIndex(b => b.id === targetBlock.id);
  const nextBlockInColumn = sameXBlocks[targetIndexInColumn + 1];
  const spaceBelow = nextBlockInColumn
    ? nextBlockInColumn.y - (targetBlock.y + targetBlock.height)
    : Infinity;

  if (rightSpace >= minBlockWidth) {
    const newBlockWidth = Math.min(rightSpace, draggedBlock.width);
    const newX = rightEdge + 12;

    return {
      newBlock: { ...draggedBlock, row: targetBlock.row, x: newX, y: 0, width: newBlockWidth },
      updatedBlocks
    };
  } else if (targetBlock.width >= minBlockWidth + 12) {
    const newBlockWidth = Math.max(minBlockWidth, Math.floor((targetBlock.width - 12) / 2));
    const remainingWidth = targetBlock.width - newBlockWidth - 12;

    if (remainingWidth >= minBlockWidth) {
      updatedBlocks = updatedBlocks.map(block => {
        if (block.id === targetBlock.id) {
          return { ...block, width: remainingWidth, y: 0 };
        }
        return block;
      });

      return {
        newBlock: { ...draggedBlock, row: targetBlock.row, x: targetBlock.x + remainingWidth + 12, y: 0, width: newBlockWidth },
        updatedBlocks
      };
    }
  } else if (spaceBelow >= draggedBlock.height + 12) {
    const newY = targetBlock.y + targetBlock.height + 12;

    if (canPlaceBlock(updatedBlocks, targetBlock.row, targetBlock.x, newY, targetBlock.width, draggedBlock.height, draggedBlock.id)) {
      return {
        newBlock: { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: newY, width: targetBlock.width },
        updatedBlocks
      };
    }
  } else if (availableSpace >= minBlockWidth) {
    const spaceForNewBlock = Math.min(Math.floor(targetBlock.width / 2), availableSpace);
    if (spaceForNewBlock >= minBlockWidth) {
      updatedBlocks = updatedBlocks.map(block => {
        if (block.id === targetBlock.id) {
          return { ...block, width: block.width - spaceForNewBlock - 12 };
        }
        return block;
      });
      return {
        newBlock: { ...draggedBlock, row: targetBlock.row, x: targetBlock.x + targetBlock.width - spaceForNewBlock - 12, y: 0, width: spaceForNewBlock },
        updatedBlocks
      };
    }
  }

  // 새 행 생성
  updatedBlocks = updatedBlocks.map(block => {
    if (block.row > targetBlock.row) {
      return { ...block, row: block.row + 1 };
    }
    return block;
  });
  return {
    newBlock: { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth },
    updatedBlocks
  };
}
