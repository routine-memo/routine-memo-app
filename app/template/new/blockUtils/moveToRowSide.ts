import { BlockPosition } from '../types';
import { getRowBlocks, getBlocksOccupyingRow } from './queries';
import { redistributeRow } from './redistribution';
import { redistributeBlocksSequentially } from './sequentialRedistribution';
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
  const originalRowBlocks = getRowBlocks(updatedBlocks, draggedBlock.row);
  let adjustedTargetRow = effectiveTargetRow;

  if (originalRowBlocks.length > 0) {
    updatedBlocks = redistributeRow(updatedBlocks, draggedBlock.row, draggedBlock);
  } else {
    // 원래 행이 비었으면 아래 행들을 올림
    updatedBlocks = updatedBlocks.map(b => {
      if (b.row > draggedBlock.row) {
        return { ...b, row: b.row - 1 };
      }
      return b;
    });

    // 타겟 행이 원래 행보다 아래에 있으면 행 번호가 1 감소
    if (effectiveTargetRow > draggedBlock.row) {
      adjustedTargetRow = effectiveTargetRow - 1;
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

  // 5. 멀티행 블록인지 확인
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);

  // 멀티행 블록의 경우 차지할 모든 행 체크
  if (draggedBlockRows > 1) {
    console.log(`🔍 멀티행 블록 (${draggedBlockRows}행) 배치 검증 중...`);

    // 이 블록이 차지할 모든 행에서 시작하는 블록들 체크
    for (let i = 0; i < draggedBlockRows; i++) {
      const checkRow = adjustedTargetRow + i;
      const startingBlocksInRow = getRowBlocks(updatedBlocks, checkRow);

      console.log(`  행 ${checkRow}: ${startingBlocksInRow.length}개 블록 시작`);

      // 각 행마다 최대 3개까지만 허용
      if (startingBlocksInRow.length >= 3) {
        console.log(`❌ 행 ${checkRow}에 이미 블록 3개 시작, 배치 불가`);
        return null;
      }
    }

    // 순차적 재정렬 로직 사용
    console.log(`✅ 모든 행 검증 통과, 순차적 재정렬 시작`);

    // 순차적 재정렬 함수 호출
    const finalBlocks = redistributeBlocksSequentially(
      updatedBlocks,
      draggedBlock,
      adjustedTargetRow
    );

    console.log(`✅ 멀티행 블록 배치 완료`);

    return finalBlocks;
  } else {
    // 싱글행 블록인 경우 기존 로직 사용 (타겟 행만 재분배)
    console.log(`📍 싱글행 블록 배치 - 행 ${adjustedTargetRow} 재분배`);

    // 타겟 행에서 시작하는 블록 수 체크
    const startingBlocks = getRowBlocks(updatedBlocks, adjustedTargetRow);
    if (startingBlocks.length >= 3) {
      console.log(`❌ 타겟 행 ${adjustedTargetRow}에 이미 블록 3개 시작`);
      return null;
    }

    // occupyingBlocks의 순서대로 colStart 정렬된 상태에서 insertIndex 위치에 삽입
    const blocksInOrder = [
      ...occupyingBlocks.slice(0, insertIndex),
      { ...draggedBlock, row: adjustedTargetRow, colStart: 0, colSpan: 0 }, // 임시값
      ...occupyingBlocks.slice(insertIndex)
    ];

    console.log(`📋 새 순서 (${blocksInOrder.length}개):`, blocksInOrder.map(b => ({ id: b.id, row: b.row })));

    // 열 균등 분배
    const avgColSpan = Math.floor(GRID_COLS / blocksInOrder.length);
    const remainder = GRID_COLS % blocksInOrder.length;

    let currentColStart = 0;
    const redistributedBlocks = blocksInOrder.map((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);

      // 새 블록이면 row를 adjustedTargetRow로 설정
      // 기존 블록이면 원래 row 유지 (멀티행 블록도 원래 row 유지)
      const updated = {
        ...block,
        row: block.id === draggedBlock.id ? adjustedTargetRow : block.row,
        colStart: currentColStart,
        colSpan: colSpan
      };
      currentColStart += colSpan;
      return updated;
    });

    console.log(`🔢 재분배 결과:`, redistributedBlocks.map(b => ({
      id: b.id,
      row: b.row,
      colStart: b.colStart,
      colSpan: b.colSpan
    })));

    // redistributedBlocks에 포함된 블록들의 ID를 제외한 나머지 블록들
    const redistributedIds = new Set(redistributedBlocks.map(b => b.id));
    const otherBlocks = updatedBlocks.filter(b => !redistributedIds.has(b.id));

    return [...otherBlocks, ...redistributedBlocks];
  }
};
