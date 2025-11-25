import { BlockPosition } from '../types';
import { getBlocksOccupyingRow, getRowBlocks } from './queries';
import { redistributeBlocksSequentially, redistributeAfterRemoval } from './sequentialRedistribution';
import { calculateRows } from './calculations';
import { ROW_HEIGHT, GRID_COLS } from './constants';

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

  // ===== STEP 2: 드래그 블록 제거 및 원래 행 정리 =====
  let updatedBlocks = blocks.filter(b => b.id !== draggedBlock.id);
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);

  const originalRowOccupyingBlocks = getBlocksOccupyingRow(updatedBlocks, draggedBlock.row);

  if (originalRowOccupyingBlocks.length === 0) {
    // 원래 행이 비었으면 아래 행들을 올림
    updatedBlocks = updatedBlocks.map(b => {
      if (b.row > draggedBlock.row) {
        return { ...b, row: b.row - 1 };
      }
      return b;
    });

    // 목표 행이 원래 행보다 아래에 있을 때만 조정
    if (destinationRow > draggedBlock.row) {
      destinationRow = Math.max(0, destinationRow - 1);
      console.log('📍 빈 행 제거로 목표 행 조정:', destinationRow);
    }
  } else {
    // 원래 행에 블록이 남아있으면 재정렬
    console.log(`🔄 원래 행 재정렬 시작: 행 ${draggedBlock.row}`);
    updatedBlocks = redistributeAfterRemoval(updatedBlocks, draggedBlock.row);
  }

  // ===== STEP 3: 목표 행에 있는 블록들 확인 =====
  const destinationRowBlocks = getBlocksOccupyingRow(updatedBlocks, destinationRow);
  const hasBlocksAtDestination = destinationRowBlocks.length > 0;

  console.log('📊 목표 행 분석:', {
    destinationRow,
    blocksOccupying: destinationRowBlocks.length,
    blockDetails: destinationRowBlocks.map(b => ({
      id: b.id,
      row: b.row,
      colStart: b.colStart,
      colSpan: b.colSpan,
      isMultiRow: calculateRows(b.height || ROW_HEIGHT) > 1
    }))
  });

  // ===== STEP 4: below 드롭 + 충돌 시 특수 처리 =====
  if (position === 'below' && hasBlocksAtDestination) {
    console.log('🚨 below 드롭 + 충돌 발생 → 특수 처리');

    // 충돌 블록 중 멀티행 블록이 있는지 확인
    const multiRowBlocks = destinationRowBlocks.filter(b => {
      const blockRows = calculateRows(b.height || ROW_HEIGHT);
      return blockRows > 1 && b.row < destinationRow; // 위 행에서 시작한 멀티행
    });

    const singleRowBlocks = destinationRowBlocks.filter(b => b.row === destinationRow);

    console.log(`  멀티행 블록: ${multiRowBlocks.length}개`, multiRowBlocks.map(b => b.id));
    console.log(`  싱글행 블록: ${singleRowBlocks.length}개`, singleRowBlocks.map(b => b.id));

    if (multiRowBlocks.length > 0) {
      // 멀티행 블록과 충돌 → 남은 열만 차지
      console.log('📐 멀티행 블록과 충돌 → 나머지 열만 차지');

      // 멀티행 블록들이 차지하는 열 범위 계산
      const occupiedCols = new Set<number>();
      multiRowBlocks.forEach(b => {
        for (let col = b.colStart; col < b.colStart + b.colSpan; col++) {
          occupiedCols.add(col);
        }
      });

      // 비어있는 열 찾기
      const availableCols: number[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        if (!occupiedCols.has(col)) {
          availableCols.push(col);
        }
      }

      if (availableCols.length === 0) {
        console.log('❌ 사용 가능한 열이 없음 → 동작 취소');
        return null;
      }

      // 드래그 블록을 남은 열에 배치
      const newColStart = Math.min(...availableCols);
      const newColSpan = availableCols.length;

      console.log(`  드래그 블록 배치: colStart=${newColStart}, colSpan=${newColSpan}`);

      const newDraggedBlock: BlockPosition = {
        ...draggedBlock,
        row: destinationRow,
        colStart: newColStart,
        colSpan: newColSpan
      };

      let finalBlocks = [...updatedBlocks, newDraggedBlock];

      // 싱글 블록들도 있으면 같이 재정렬
      if (singleRowBlocks.length > 0) {
        console.log('  싱글 블록들도 함께 재정렬');
        const blocksToRedistribute = [newDraggedBlock, ...singleRowBlocks];

        // 열 번호 순으로 정렬
        blocksToRedistribute.sort((a, b) => a.colStart - b.colStart);

        // 사용 가능한 열에 균등 분배
        const avgColSpan = Math.floor(availableCols.length / blocksToRedistribute.length);
        const remainder = availableCols.length % blocksToRedistribute.length;

        let currentIdx = 0;
        const redistributed = blocksToRedistribute.map((block, index) => {
          const colSpan = avgColSpan + (index < remainder ? 1 : 0);
          const colStart = availableCols[currentIdx];
          currentIdx += colSpan;

          return {
            ...block,
            colStart,
            colSpan
          };
        });

        // 업데이트
        finalBlocks = updatedBlocks.filter(b =>
          !blocksToRedistribute.some(rb => rb.id === b.id)
        ).concat(redistributed);
      }

      finalBlocks = removeEmptyRows(finalBlocks);
      console.log('✅ 멀티행 충돌 처리 완료');
      return finalBlocks;
    } else {
      // 싱글행 블록들만 있음 → 밀어내기
      console.log('📍 싱글행 블록들만 충돌 → 밀어내기');

      // 싱글 블록들과 드래그 블록을 합쳐서 총 개수 확인
      const totalBlocksInRow = singleRowBlocks.length + 1; // +1 = 드래그 블록

      if (totalBlocksInRow > 3) {
        console.log(`❌ 한 행에 ${totalBlocksInRow}개 블록 → 동작 취소`);
        return null;
      }

      // 싱글 블록들을 아래로 밀어내기
      updatedBlocks = updatedBlocks.map(b => {
        if (b.row >= destinationRow) {
          return { ...b, row: b.row + draggedBlockRows };
        }
        return b;
      });

      // 드래그 블록 배치
      const newDraggedBlock: BlockPosition = {
        ...draggedBlock,
        row: destinationRow,
        colStart: 0,
        colSpan: GRID_COLS
      };

      let finalBlocks = [...updatedBlocks, newDraggedBlock];
      finalBlocks = removeEmptyRows(finalBlocks);

      console.log('✅ 싱글행 밀어내기 완료');
      return finalBlocks;
    }
  }

  // ===== STEP 5: above 드롭 또는 충돌 없는 경우 =====
  if (position === 'above' || hasBlocksAtDestination) {
    console.log('🆕 새 행 삽입 (above 드롭 또는 충돌)');

    // 블록들을 아래로 밀기
    updatedBlocks = updatedBlocks.map(b => {
      if (b.row >= destinationRow) {
        return { ...b, row: b.row + draggedBlockRows };
      }
      return b;
    });

    // 드래그 블록 배치
    let finalBlocks = redistributeBlocksSequentially(
      updatedBlocks,
      draggedBlock,
      destinationRow
    );

    finalBlocks = removeEmptyRows(finalBlocks);
    return finalBlocks;
  }

  // ===== STEP 6: 기존 행에 합류 (순차적 재정렬) =====
  console.log(`📍 블록을 행 ${destinationRow}에 배치 - 순차적 재정렬`);

  let finalBlocks = redistributeBlocksSequentially(
    updatedBlocks,
    draggedBlock,
    destinationRow
  );

  finalBlocks = removeEmptyRows(finalBlocks);

  console.log('✅ moveBlockToRow 완료');
  return finalBlocks;
};

/**
 * 빈 행을 제거하고 블록들을 위로 당김
 */
function removeEmptyRows(blocks: BlockPosition[]): BlockPosition[] {
  if (blocks.length === 0) return blocks;

  // 모든 행 번호 수집 (블록이 차지하는 모든 행)
  const occupiedRows = new Set<number>();
  blocks.forEach(block => {
    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    for (let i = 0; i < blockRows; i++) {
      occupiedRows.add(block.row + i);
    }
  });

  // 최대 행 찾기
  const maxRow = Math.max(...Array.from(occupiedRows));

  // 0부터 maxRow까지 빈 행 찾기
  const emptyRows: number[] = [];
  for (let row = 0; row <= maxRow; row++) {
    if (!occupiedRows.has(row)) {
      emptyRows.push(row);
    }
  }

  if (emptyRows.length === 0) {
    return blocks; // 빈 행 없음
  }

  console.log(`🗑️  빈 행 제거: ${emptyRows.length}개 (행 ${emptyRows})`);

  // 각 블록의 행 번호를 조정
  return blocks.map(block => {
    // 이 블록보다 위에 있는 빈 행 개수 계산
    const emptyRowsAbove = emptyRows.filter(emptyRow => emptyRow < block.row).length;

    if (emptyRowsAbove > 0) {
      return {
        ...block,
        row: block.row - emptyRowsAbove
      };
    }

    return block;
  });
}
