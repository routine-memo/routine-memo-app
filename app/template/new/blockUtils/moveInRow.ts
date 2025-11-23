import { BlockPosition } from '../types';
import { getRowBlocks } from './queries';
import { getTotalColSpan } from './calculations';
import { GRID_COLS } from './constants';

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
