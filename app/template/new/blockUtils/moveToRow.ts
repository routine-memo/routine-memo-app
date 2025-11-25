import { BlockPosition } from '../types';
import { getBlocksOccupyingRow, getRowBlocks } from './queries';
import { redistributeBlocksSequentially, redistributeAfterRemoval } from './sequentialRedistribution';
import { calculateRows } from './calculations';
import { ROW_HEIGHT, GRID_COLS } from './constants';
import { validateMinimumColumns } from './validation';

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
      // 멀티행 블록과 충돌 → 빈 공간 확인 후 판단
      console.log('📐 멀티행 블록과 충돌 → 빈 공간 확인');

      // 멀티행 블록들이 차지하는 열 범위 계산
      const occupiedCols = new Set<number>();
      multiRowBlocks.forEach(b => {
        for (let col = b.colStart; col < b.colStart + b.colSpan; col++) {
          occupiedCols.add(col);
        }
      });

      // 싱글 블록들이 차지하는 열 추가
      singleRowBlocks.forEach(b => {
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

      console.log(`  차지된 열: ${Array.from(occupiedCols).sort((a, b) => a - b)}`);
      console.log(`  사용 가능한 열: ${availableCols.length}개 (${availableCols})`);

      // 빈 공간이 있으면 간접 블록 검증 생략하고 빈 공간만 사용
      if (availableCols.length > 0) {
        console.log(`✅ 빈 공간 있음 → 간접 블록 검증 생략, 빈 공간만 사용`);

        // 드래그 블록이 시작하는 행만 체크
        const startingBlocksInDestRow = getRowBlocks(updatedBlocks, destinationRow);
        if (startingBlocksInDestRow.length >= 3) {
          console.log(`❌ 행 ${destinationRow}에 이미 블록 3개 시작, 배치 불가`);
          return null;
        }

        // 최소 열 개수 검증 (각 블록은 최소 2열 필요)
        const totalBlocksInRow = startingBlocksInDestRow.length + 1; // +1 = 드래그 블록
        const { valid, minColsNeeded } = validateMinimumColumns(totalBlocksInRow, GRID_COLS);
        if (!valid) {
          console.log(`❌ 블록 ${totalBlocksInRow}개가 최소 ${minColsNeeded}열 필요, 현재 ${GRID_COLS}열 → 동작 취소`);
          return null;
        }
      } else {
        console.log(`🔴 빈 공간 없음 → 간접 블록 포함 검증 필요`);

        // 멀티행 블록들이 차지하는 모든 행 찾기
        const affectedRows = new Set<number>();
        multiRowBlocks.forEach(b => {
          const blockRows = calculateRows(b.height || ROW_HEIGHT);
          for (let i = 0; i < blockRows; i++) {
            affectedRows.add(b.row + i);
          }
        });

        console.log(`  영향받는 행:`, Array.from(affectedRows).sort((a, b) => a - b));

        // 간접 블록 찾기 (영향받는 행에서 시작하는 모든 블록)
        const indirectBlocks: BlockPosition[] = [];
        for (const row of affectedRows) {
          const blocksStartingInRow = getRowBlocks(updatedBlocks, row);
          blocksStartingInRow.forEach(b => {
            if (!multiRowBlocks.some(mb => mb.id === b.id) &&
                !singleRowBlocks.some(sb => sb.id === b.id) &&
                !indirectBlocks.some(ib => ib.id === b.id)) {
              indirectBlocks.push(b);
            }
          });
        }

        console.log(`  간접 블록: ${indirectBlocks.length}개`, indirectBlocks.map(b => b.id));

        // 총 블록 개수 검증 (멀티행 + 간접 + 싱글 + 드래그)
        const totalBlocks = multiRowBlocks.length + indirectBlocks.length + singleRowBlocks.length + 1;
        console.log(`  총 블록 개수: ${totalBlocks} (멀티${multiRowBlocks.length} + 간접${indirectBlocks.length} + 싱글${singleRowBlocks.length} + 드래그1)`);

        if (totalBlocks > 3) {
          console.log(`❌ 한 행에 ${totalBlocks}개 블록 → 동작 취소`);
          return null;
        }

        // 최소 열 개수 검증
        const { valid, minColsNeeded } = validateMinimumColumns(totalBlocks, GRID_COLS);
        if (!valid) {
          console.log(`❌ 블록 ${totalBlocks}개가 최소 ${minColsNeeded}열 필요, 현재 ${GRID_COLS}열 → 동작 취소`);
          return null;
        }
      }

      // 빈 공간이 있을 때만 배치 진행
      // 싱글 블록들이 있으면 빈 공간을 나눠 먹음
      if (singleRowBlocks.length > 0) {
        console.log('  싱글 블록들과 함께 빈 공간 균등 분배');
        const blocksToPlace = [draggedBlock, ...singleRowBlocks];

        // 열 번호 순으로 정렬 (원래 위치 기준)
        blocksToPlace.sort((a, b) => a.colStart - b.colStart);

        // 사용 가능한 열에 균등 분배
        const avgColSpan = Math.floor(availableCols.length / blocksToPlace.length);
        const remainder = availableCols.length % blocksToPlace.length;

        let currentIdx = 0;
        const placedBlocks = blocksToPlace.map((block, index) => {
          const colSpan = avgColSpan + (index < remainder ? 1 : 0);
          const colStart = availableCols[currentIdx];
          currentIdx += colSpan;

          return {
            ...block,
            row: destinationRow,
            colStart,
            colSpan
          };
        });

        // 업데이트
        let finalBlocks = updatedBlocks.filter(b =>
          !placedBlocks.some(pb => pb.id === b.id)
        ).concat(placedBlocks);

        // 드래그 블록도 멀티행이면 하단 블록들을 멀티행 길이만큼 밀어내기
        if (draggedBlockRows > 1) {
          console.log(`  드래그 블록도 멀티행 (${draggedBlockRows}행) → 하단 블록 밀어내기`);
          const rowsToShift = destinationRow + draggedBlockRows;
          finalBlocks = finalBlocks.map(b => {
            // 영향받는 행 범위를 벗어난 블록들만 밀어냄
            if (b.row >= rowsToShift && !placedBlocks.some(pb => pb.id === b.id)) {
              return { ...b, row: b.row + draggedBlockRows };
            }
            return b;
          });
        }

        finalBlocks = removeEmptyRows(finalBlocks);
        console.log('✅ 멀티행 충돌 처리 완료');
        return finalBlocks;
      } else {
        // 싱글 블록 없음 → 드래그 블록만 빈 공간 차지
        console.log('  싱글 블록 없음 → 드래그 블록만 빈 공간 차지');

        const newColStart = Math.min(...availableCols);
        const newColSpan = availableCols.length;

        const newDraggedBlock: BlockPosition = {
          ...draggedBlock,
          row: destinationRow,
          colStart: newColStart,
          colSpan: newColSpan
        };

        let finalBlocks = [...updatedBlocks, newDraggedBlock];

        // 드래그 블록도 멀티행이면 하단 블록들 밀어내기
        if (draggedBlockRows > 1) {
          console.log(`  드래그 블록도 멀티행 (${draggedBlockRows}행) → 하단 블록 밀어내기`);
          const rowsToShift = destinationRow + draggedBlockRows;
          finalBlocks = finalBlocks.map(b => {
            if (b.row >= rowsToShift && b.id !== draggedBlock.id) {
              return { ...b, row: b.row + draggedBlockRows };
            }
            return b;
          });
        }

        finalBlocks = removeEmptyRows(finalBlocks);
        console.log('✅ 멀티행 충돌 처리 완료');
        return finalBlocks;
      }
    } else {
      // 싱글행 블록들만 있음 → 밀어내기
      console.log('📍 싱글행 블록들만 충돌 → 밀어내기');

      // 싱글 블록들과 드래그 블록을 합쳐서 총 개수 확인
      const totalBlocksInRow = singleRowBlocks.length + 1; // +1 = 드래그 블록

      if (totalBlocksInRow > 3) {
        console.log(`❌ 한 행에 ${totalBlocksInRow}개 블록 → 동작 취소`);
        return null;
      }

      // 최소 열 개수 검증
      const { valid, minColsNeeded } = validateMinimumColumns(totalBlocksInRow, GRID_COLS);
      if (!valid) {
        console.log(`❌ 블록 ${totalBlocksInRow}개가 최소 ${minColsNeeded}열 필요, 현재 ${GRID_COLS}열 → 동작 취소`);
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
