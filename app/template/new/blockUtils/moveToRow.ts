import { BlockPosition } from '../types';
import { getRowBlocks, getBlocksOccupyingRow } from './queries';
import { redistributeRow } from './redistribution';
import { redistributeBlocksSequentially, redistributeAfterRemoval } from './sequentialRedistribution';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';

// 블록을 다른 블록 위/아래로 이동
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
  const destinationRowOccupyingBlocks = getBlocksOccupyingRow(blocksExcludingDragged, destinationRow);
  const hasBlocksAtDestination = destinationRowOccupyingBlocks.length > 0;

  // 드래그 중인 블록이 원래 목표 행에 있었는지 확인
  const draggedBlockWasAtDestination = draggedBlock.row === destinationRow;

  // above 드롭의 경우 목표 행(= targetBlock.row)에 블록을 삽입하고 기존 블록들을 밀어내야 함
  const needNewRowInsertion =
    (position === 'above') ||
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

  // 드래그된 블록이 멀티행인지 확인
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);
  const isDraggedMultiRow = draggedBlockRows > 1;

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
      destinationRow = Math.max(0, destinationRow - 1);
      console.log('📍 빈 행 제거로 목표 행 조정:', destinationRow);
    } else {
      // 원래 행에 블록이 남아있으면 재정렬
      console.log(`🔄 원래 행 재정렬 시작 (새 행 생성): 행 ${draggedBlock.row}에서 재정렬`);

      // 멀티행 블록이었다면 연결된 블록들도 재정렬
      if (isDraggedMultiRow) {
        console.log('🔄 멀티행 블록 제거 - 연결된 블록들 재정렬');
        updatedBlocks = redistributeAfterRemoval(updatedBlocks, draggedBlock.row);
      } else {
        // 싱글행 블록은 기존 로직 사용
        updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);
      }

      console.log('✅ 원래 행 재정렬 완료 (새 행 생성 케이스)');
    }

    // 목표 행 이상의 블록들을 아래로 밀기 (새 행 삽입)
    if (needNewRowInsertion) {
      const blocksOccupyingDestination = getBlocksOccupyingRow(updatedBlocks, destinationRow);
      const minRowToShift = blocksOccupyingDestination.length > 0
        ? Math.min(destinationRow, ...blocksOccupyingDestination.map(b => b.row))
        : destinationRow;

      console.log(`🔽 행 ${minRowToShift} 이상의 블록들을 ${draggedBlockRows}행만큼 아래로 밀기`);

      updatedBlocks = updatedBlocks.map(b => {
        if (b.row >= minRowToShift) {
          return { ...b, row: b.row + draggedBlockRows };
        }
        return b;
      });

      destinationRow = minRowToShift;
    }

    // 새 행에 블록 배치 - 순차적 재정렬 사용
    console.log(`📍 블록을 행 ${destinationRow}에 배치 - 순차적 재정렬 사용`);

    const finalBlocks = redistributeBlocksSequentially(
      updatedBlocks,
      draggedBlock,
      destinationRow
    );

    console.log('✅ 새 블록 위치 (새 행)');
    return finalBlocks;
  }

  // ===== STEP 3: 목표 행이 존재하는 경우 - 순차적 재정렬 사용 =====
  const destinationRowBlocks = getBlocksOccupyingRow(blocksExcludingDragged, destinationRow);

  console.log('📊 목표 행 분석 (제거 전):', {
    destinationRow,
    blocksOccupying: destinationRowBlocks.length,
    blockDetails: destinationRowBlocks.map(b => ({
      id: b.id,
      startRow: b.row,
      colStart: b.colStart,
      colSpan: b.colSpan
    }))
  });

  // ===== STEP 4: 드래그한 블록 제거 및 원래 행 정리 =====
  let updatedBlocks = blocksExcludingDragged;

  const originalRowOccupyingBlocks = getBlocksOccupyingRow(updatedBlocks, draggedBlock.row);

  console.log(`🔍 원래 행 ${draggedBlock.row} 상태:`, {
    occupyingBlocks: originalRowOccupyingBlocks.length,
    blocks: originalRowOccupyingBlocks.map(b => ({ id: b.id, row: b.row }))
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
  } else if (draggedBlock.row !== targetBlock.row) {
    // 원래 행에 다른 블록들이 있고, 타겟과 다른 행이면 재정렬
    console.log(`🔄 원래 행 재정렬 시작 (기존 행): 행 ${draggedBlock.row}에서 재정렬`);

    // 멀티행 블록이었다면 연결된 블록들도 재정렬
    if (isDraggedMultiRow) {
      console.log('🔄 멀티행 블록 제거 - 연결된 블록들 재정렬');
      updatedBlocks = redistributeAfterRemoval(updatedBlocks, draggedBlock.row);
    } else {
      // 싱글행 블록은 기존 로직 사용
      updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);
    }

    console.log('✅ 원래 행 재정렬 완료 (기존 행 케이스)');
  }

  // ===== STEP 5: 목표 행에 블록 배치 - 순차적 재정렬 사용 =====
  console.log(`📍 블록을 행 ${destinationRow}에 배치 - 순차적 재정렬 사용`);

  const finalBlocks = redistributeBlocksSequentially(
    updatedBlocks,
    draggedBlock,
    destinationRow
  );

  console.log('✅ moveBlockToRow 완료');
  return finalBlocks;
};
