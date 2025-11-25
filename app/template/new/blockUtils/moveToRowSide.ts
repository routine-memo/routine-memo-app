import { BlockPosition } from '../types';
import { getRowBlocks, getBlocksOccupyingRow } from './queries';
import { redistributeBlocksSequentially, redistributeAfterRemoval } from './sequentialRedistribution';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';

// 블록을 다른 행의 블록 옆에 배치
export const moveBlockToRowSide = (
  blocks: BlockPosition[],
  draggedBlock: BlockPosition,
  targetBlock: BlockPosition,
  position: 'left' | 'right',
  targetRow?: number // 멀티행 블록의 경우 특정 행 지정
): BlockPosition[] | null => {
  // targetRow가 지정되어 있으면 사용, 없으면 targetBlock.row 사용
  const effectiveTargetRow = targetRow !== undefined ? targetRow : targetBlock.row;


  // 1. 드래그한 블록을 원래 행에서 제거
  let updatedBlocks = blocks.filter(b => b.id !== draggedBlock.id);

  // 2. 원래 행의 블록들 재정렬
  // 드래그된 블록이 멀티행인지 확인
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);
  const isDraggedMultiRow = draggedBlockRows > 1;

  // 드래그된 블록이 차지하는 모든 행에서 시작하는 블록들 확인
  let hasRemainingBlocks = false;
  for (let i = 0; i < draggedBlockRows; i++) {
    const blocksInRow = getRowBlocks(updatedBlocks, draggedBlock.row + i);
    if (blocksInRow.length > 0) {
      hasRemainingBlocks = true;
      break;
    }
  }

  let adjustedTargetRow = effectiveTargetRow;

  if (hasRemainingBlocks) {
    // 원래 행의 블록들 재정렬 (열 겹침 고려)
    console.log('🔄 원래 행 재정렬 - 연결된 블록들 재정렬 (열 겹침 고려)');
    updatedBlocks = redistributeAfterRemoval(updatedBlocks, draggedBlock.row);
  } else {
    // 모든 행이 비었으면 아래 행들을 올림
    const lastOccupiedRow = draggedBlock.row + draggedBlockRows - 1;
    updatedBlocks = updatedBlocks.map(b => {
      if (b.row > lastOccupiedRow) {
        return { ...b, row: b.row - draggedBlockRows };
      }
      return b;
    });

    // 타겟 행이 원래 행보다 아래에 있으면 행 번호 조정
    if (effectiveTargetRow > lastOccupiedRow) {
      adjustedTargetRow = effectiveTargetRow - draggedBlockRows;
      console.log('📍 타겟 행 조정:', effectiveTargetRow, '→', adjustedTargetRow);
    }
  }

  // 3. 타겟 행을 차지하는 모든 블록들 가져오기
  // 멀티행이든 싱글행이든 상관없이 해당 행을 차지하는 모든 블록 포함
  const occupyingBlocks = getBlocksOccupyingRow(updatedBlocks, adjustedTargetRow);

  console.log(`🔍 타겟 행 ${adjustedTargetRow}을 차지하는 블록:`, occupyingBlocks.map(b => ({
    id: b.id,
    row: b.row,
    colStart: b.colStart,
    colSpan: b.colSpan,
    isMultiRow: calculateRows(b.height) > 1
  })));

  // 4. 삽입 위치 결정 (targetBlock의 colStart 기준)
  let insertIndex: number;

  if (position === 'left') {
    // targetBlock의 colStart보다 작은 colStart를 가진 블록들의 개수
    insertIndex = occupyingBlocks.filter(b => b.colStart < targetBlock.colStart).length;
  } else {
    // targetBlock의 colStart보다 작거나 같은 colStart를 가진 블록들의 개수
    insertIndex = occupyingBlocks.filter(b => b.colStart <= targetBlock.colStart).length;
  }

  console.log(`📌 삽입 위치: targetBlock.colStart=${targetBlock.colStart}, position=${position}, insertIndex=${insertIndex}`);

  // 5. 빈 공간 계산 - 실제 배치될 위치 확인
  // occupyingBlocks를 colStart 순으로 정렬한 상태에서 빈 공간 찾기
  const sortedOccupyingBlocks = [...occupyingBlocks].sort((a, b) => a.colStart - b.colStart);

  // 전체 6열에서 차지된 열 찾기
  const occupiedCols = new Set<number>();
  sortedOccupyingBlocks.forEach(b => {
    for (let col = b.colStart; col < b.colStart + b.colSpan; col++) {
      occupiedCols.add(col);
    }
  });

  // 빈 열 찾기
  const availableCols: number[] = [];
  for (let col = 0; col < GRID_COLS; col++) {
    if (!occupiedCols.has(col)) {
      availableCols.push(col);
    }
  }

  console.log(`📊 타겟 행 열 상태: 차지됨=${Array.from(occupiedCols).sort((a, b) => a - b)}, 빈공간=${availableCols}`);

  // 빈 공간이 충분한지 확인 (드래그 블록이 들어갈 최소 공간 필요)
  const hasEmptySpace = availableCols.length > 0;

  // 열 겹침 여부 판단:
  // 1. 빈 공간이 있고
  // 2. insertIndex 위치에 블록을 넣었을 때 재분배 없이 빈 공간만 사용 가능하면 → 겹침 없음
  // 3. 그 외 → 겹침 있음 (재분배 필요)

  let hasColumnOverlapWithExisting = !hasEmptySpace;

  if (hasEmptySpace) {
    // insertIndex 기준으로 왼쪽/오른쪽 블록 분리
    const leftBlocks = sortedOccupyingBlocks.slice(0, insertIndex);
    const rightBlocks = sortedOccupyingBlocks.slice(insertIndex);

    // 왼쪽 블록들이 차지하는 최대 열
    const leftMaxCol = leftBlocks.length > 0
      ? Math.max(...leftBlocks.map(b => b.colStart + b.colSpan - 1))
      : -1;

    // 오른쪽 블록들이 차지하는 최소 열
    const rightMinCol = rightBlocks.length > 0
      ? Math.min(...rightBlocks.map(b => b.colStart))
      : GRID_COLS;

    // 왼쪽과 오른쪽 사이에 빈 공간이 있는지 확인
    const gapStart = leftMaxCol + 1;
    const gapEnd = rightMinCol - 1;
    const hasGapBetween = gapStart <= gapEnd;

    console.log(`  왼쪽 블록 최대 열: ${leftMaxCol}, 오른쪽 블록 최소 열: ${rightMinCol}, 사이 빈공간: ${hasGapBetween ? `${gapStart}~${gapEnd}` : '없음'}`);

    // 사이에 빈 공간이 있으면 열 겹침 없음
    hasColumnOverlapWithExisting = !hasGapBetween;
  }

  console.log(`📊 열 겹침 여부: ${hasColumnOverlapWithExisting ? '있음 (열 나눠먹기 필요)' : '없음 (빈 공간 배치)'}`);

  // 6. 멀티행 블록의 경우 차지할 모든 행 체크
  if (isDraggedMultiRow) {
    console.log(`🔍 멀티행 블록 (${draggedBlockRows}행) 배치 검증 중...`);

    // 열 겹침이 있을 때만 간접 블록 검증
    if (hasColumnOverlapWithExisting) {
      console.log(`  열 겹침 있음 → 간접 블록 포함 검증`);

      // 6-1. 타겟 행들에 있는 모든 블록 찾기 (멀티행 블록 포함)
      const targetRowsBlocks = new Set<BlockPosition>();
      for (let i = 0; i < draggedBlockRows; i++) {
        const checkRow = adjustedTargetRow + i;
        const occupyingBlocks = getBlocksOccupyingRow(updatedBlocks, checkRow);
        occupyingBlocks.forEach(b => targetRowsBlocks.add(b));
      }

      console.log(`  타겟 행 ${adjustedTargetRow}~${adjustedTargetRow + draggedBlockRows - 1}을 차지하는 블록: ${targetRowsBlocks.size}개`);

      // 6-2. 멀티행 블록과 싱글행 블록 분류
      const multiRowBlocksInTarget: BlockPosition[] = [];
      const singleRowBlocksInTarget: BlockPosition[] = [];

      targetRowsBlocks.forEach(b => {
        const blockRows = calculateRows(b.height || ROW_HEIGHT);
        if (blockRows > 1 && b.row < adjustedTargetRow) {
          multiRowBlocksInTarget.push(b);
        } else if (b.row >= adjustedTargetRow && b.row < adjustedTargetRow + draggedBlockRows) {
          singleRowBlocksInTarget.push(b);
        }
      });

      console.log(`    멀티행 블록: ${multiRowBlocksInTarget.length}개`, multiRowBlocksInTarget.map(b => b.id));
      console.log(`    싱글행 블록: ${singleRowBlocksInTarget.length}개`, singleRowBlocksInTarget.map(b => b.id));

      // 6-3. 간접 블록 찾기 (멀티행 블록이 차지하는 행에서 시작하는 모든 블록)
      const indirectBlocks: BlockPosition[] = [];

      if (multiRowBlocksInTarget.length > 0) {
        const affectedRows = new Set<number>();
        multiRowBlocksInTarget.forEach(b => {
          const blockRows = calculateRows(b.height || ROW_HEIGHT);
          for (let i = 0; i < blockRows; i++) {
            affectedRows.add(b.row + i);
          }
        });

        console.log(`    멀티행이 영향받는 행:`, Array.from(affectedRows).sort((a, b) => a - b));

        // 영향받는 행에서 시작하는 모든 블록 찾기
        for (const row of affectedRows) {
          const blocksStartingInRow = getRowBlocks(updatedBlocks, row);
          blocksStartingInRow.forEach(b => {
            if (!multiRowBlocksInTarget.some(mb => mb.id === b.id) &&
                !singleRowBlocksInTarget.some(sb => sb.id === b.id) &&
                !indirectBlocks.some(ib => ib.id === b.id)) {
              indirectBlocks.push(b);
            }
          });
        }
      }

      console.log(`    간접 블록: ${indirectBlocks.length}개`, indirectBlocks.map(b => b.id));

      // 6-4. 총 블록 개수 검증 (멀티행 + 간접 + 싱글 + 드래그)
      const totalBlocks = multiRowBlocksInTarget.length + indirectBlocks.length + singleRowBlocksInTarget.length + 1;
      console.log(`    총 블록 개수: ${totalBlocks} (멀티${multiRowBlocksInTarget.length} + 간접${indirectBlocks.length} + 싱글${singleRowBlocksInTarget.length} + 드래그1)`);

      if (totalBlocks > 3) {
        console.log(`❌ 한 행에 ${totalBlocks}개 블록 → 동작 취소`);
        return null;
      }
    } else {
      console.log(`  열 겹침 없음 → 빈 공간 배치, 간접 블록 검증 생략`);

      // 타겟 행에서 시작하는 블록 개수만 확인
      for (let i = 0; i < draggedBlockRows; i++) {
        const checkRow = adjustedTargetRow + i;
        const startingBlocks = getRowBlocks(updatedBlocks, checkRow);

        console.log(`  행 ${checkRow}: ${startingBlocks.length}개 블록 시작`);

        if (startingBlocks.length >= 3) {
          console.log(`❌ 행 ${checkRow}에 이미 블록 3개 시작, 배치 불가`);
          return null;
        }
      }
    }

    // 순차적 재정렬 로직 사용
    console.log(`✅ 모든 행 검증 통과, 순차적 재정렬 시작`);
    console.log(`📍 insertIndex=${insertIndex}, position=${position}`);

    // 정렬용 임시 colStart 설정
    // position에 따라 targetBlock 기준으로 상대적 위치 설정
    const tempColStart = position === 'left'
      ? targetBlock.colStart - 0.5  // 타겟보다 살짝 왼쪽
      : targetBlock.colStart + 0.5; // 타겟보다 살짝 오른쪽

    console.log(`📍 임시 colStart 계산: ${tempColStart} (정렬 순서용, targetBlock.colStart=${targetBlock.colStart})`);

    // 순차적 재정렬 함수 호출
    // colSpan은 임시로 1로 설정 (충돌 감지용, 실제 분배는 재정렬에서 처리)
    const draggedBlockWithNewPos = {
      ...draggedBlock,
      row: adjustedTargetRow,
      colStart: tempColStart,
      colSpan: 1  // 임시값: 순서 정렬용으로만 사용, 실제 열은 재정렬에서 균등 분배
    };

    const finalBlocks = redistributeBlocksSequentially(
      updatedBlocks,
      draggedBlockWithNewPos,
      adjustedTargetRow
    );

    console.log(`✅ 멀티행 블록 배치 완료`);

    return finalBlocks;
  } else {
    // 싱글행 블록인 경우
    console.log(`📍 싱글행 블록 배치 - 행 ${adjustedTargetRow}`);

    // 열 겹침이 있을 때만 간접 블록 검증
    if (hasColumnOverlapWithExisting) {
      console.log(`  열 겹침 있음 → 간접 블록 포함 검증`);

      // 타겟 행을 차지하는 모든 블록 찾기
      const targetRowBlocks = getBlocksOccupyingRow(updatedBlocks, adjustedTargetRow);

      // 멀티행 블록 분류
      const multiRowBlocksInTarget = targetRowBlocks.filter(b => {
        const blockRows = calculateRows(b.height || ROW_HEIGHT);
        return blockRows > 1 && b.row < adjustedTargetRow;
      });

      const singleRowBlocksInTarget = targetRowBlocks.filter(b => b.row === adjustedTargetRow);

      console.log(`    멀티행 블록: ${multiRowBlocksInTarget.length}개`, multiRowBlocksInTarget.map(b => b.id));
      console.log(`    싱글행 블록: ${singleRowBlocksInTarget.length}개`, singleRowBlocksInTarget.map(b => b.id));

      // 간접 블록 찾기
      const indirectBlocks: BlockPosition[] = [];

      if (multiRowBlocksInTarget.length > 0) {
        const affectedRows = new Set<number>();
        multiRowBlocksInTarget.forEach(b => {
          const blockRows = calculateRows(b.height || ROW_HEIGHT);
          for (let i = 0; i < blockRows; i++) {
            affectedRows.add(b.row + i);
          }
        });

        console.log(`    멀티행이 영향받는 행:`, Array.from(affectedRows).sort((a, b) => a - b));

        for (const row of affectedRows) {
          const blocksStartingInRow = getRowBlocks(updatedBlocks, row);
          blocksStartingInRow.forEach(b => {
            if (!multiRowBlocksInTarget.some(mb => mb.id === b.id) &&
                !singleRowBlocksInTarget.some(sb => sb.id === b.id) &&
                !indirectBlocks.some(ib => ib.id === b.id)) {
              indirectBlocks.push(b);
            }
          });
        }
      }

      console.log(`    간접 블록: ${indirectBlocks.length}개`, indirectBlocks.map(b => b.id));

      // 총 블록 개수 검증
      const totalBlocks = multiRowBlocksInTarget.length + indirectBlocks.length + singleRowBlocksInTarget.length + 1;
      console.log(`    총 블록 개수: ${totalBlocks} (멀티${multiRowBlocksInTarget.length} + 간접${indirectBlocks.length} + 싱글${singleRowBlocksInTarget.length} + 드래그1)`);

      if (totalBlocks > 3) {
        console.log(`❌ 한 행에 ${totalBlocks}개 블록 → 동작 취소`);
        return null;
      }
    } else {
      console.log(`  열 겹침 없음 → 빈 공간 배치, 간접 블록 검증 생략`);

      // 타겟 행에서 시작하는 블록 수만 체크
      const startingBlocks = getRowBlocks(updatedBlocks, adjustedTargetRow);
      console.log(`  행 ${adjustedTargetRow}: ${startingBlocks.length}개 블록 시작`);

      if (startingBlocks.length >= 3) {
        console.log(`❌ 타겟 행 ${adjustedTargetRow}에 이미 블록 3개 시작`);
        return null;
      }
    }

    // 열 겹침 여부에 따라 다른 처리
    if (hasColumnOverlapWithExisting) {
      // 열 겹침 있음 → 순차적 재정렬 (간접 블록 포함)
      console.log(`✅ 검증 통과, 순차적 재정렬 시작 (간접 블록 포함)`);
      console.log(`📍 insertIndex=${insertIndex}, position=${position}`);

      const tempColStart = position === 'left'
        ? targetBlock.colStart - 0.5
        : targetBlock.colStart + 0.5;

      const draggedBlockWithNewPos = {
        ...draggedBlock,
        row: adjustedTargetRow,
        colStart: tempColStart,
        colSpan: 1
      };

      const finalBlocks = redistributeBlocksSequentially(
        updatedBlocks,
        draggedBlockWithNewPos,
        adjustedTargetRow
      );

      console.log(`✅ 싱글행 블록 배치 완료`);
      return finalBlocks;

    } else {
      // 열 겹침 없음 → 빈 공간에 단순 배치
      console.log(`✅ 검증 통과, 빈 공간 단순 배치`);

      // insertIndex 기준으로 왼쪽/오른쪽 블록 분리
      const leftBlocks = sortedOccupyingBlocks.slice(0, insertIndex);
      const rightBlocks = sortedOccupyingBlocks.slice(insertIndex);

      // 빈 공간 계산
      const leftMaxCol = leftBlocks.length > 0
        ? Math.max(...leftBlocks.map(b => b.colStart + b.colSpan - 1))
        : -1;
      const rightMinCol = rightBlocks.length > 0
        ? Math.min(...rightBlocks.map(b => b.colStart))
        : GRID_COLS;

      const gapStart = leftMaxCol + 1;
      const gapEnd = rightMinCol - 1;
      const gapSize = gapEnd - gapStart + 1;

      console.log(`  빈 공간: ${gapStart}~${gapEnd} (${gapSize}열)`);

      // 드래그 블록을 빈 공간에 배치
      const newBlock = {
        ...draggedBlock,
        row: adjustedTargetRow,
        colStart: gapStart,
        colSpan: gapSize
      };

      console.log(`  드래그 블록 배치: colStart=${gapStart}, colSpan=${gapSize}`);
      console.log(`✅ 싱글행 블록 배치 완료`);

      return [...updatedBlocks, newBlock];
    }
  }
};
