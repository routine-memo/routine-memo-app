import { BlockPosition } from '../types';
import { getRowBlocks, getBlocksOccupyingRow } from './queries';
import { redistributeRow } from './redistribution';
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

  // 한 행에 최대 3개까지만 허용 (해당 행에서 시작하는 블록 기준)
  const startingBlocks = getRowBlocks(updatedBlocks, adjustedTargetRow);
  if (startingBlocks.length >= 3) {
    console.log(`❌ 타겟 행 ${adjustedTargetRow}에 이미 블록 3개 시작`);
    return null;
  }

  // 5. 멀티행 블록인지 확인
  const draggedBlockRows = calculateRows(draggedBlock.height || ROW_HEIGHT);

  if (draggedBlockRows > 1) {
    // 멀티행 블록: 연결된 모든 블록들을 추적하여 일관된 열 분배
    console.log(`🔍 멀티행 블록 (${draggedBlockRows}행) 배치 - 연결된 블록 그룹 추적 시작`);

    // 1단계: 드롭한 블록이 차지할 모든 행 수집
    const movedBlockRows = new Set<number>();
    for (let i = 0; i < draggedBlockRows; i++) {
      movedBlockRows.add(adjustedTargetRow + i);
    }
    console.log(`  드롭 블록이 차지할 행:`, Array.from(movedBlockRows));

    // 2단계: 연결된 모든 블록들을 재귀적으로 수집
    const connectedBlockIds = new Set<string>();
    const rowsToCheck = new Set(movedBlockRows);

    // 재귀적으로 연결된 블록들 찾기
    let previousConnectedSize = 0;
    let previousRowsSize = 0;

    while (connectedBlockIds.size !== previousConnectedSize || rowsToCheck.size !== previousRowsSize) {
      previousConnectedSize = connectedBlockIds.size;
      previousRowsSize = rowsToCheck.size;

      const currentRowsToCheck = Array.from(rowsToCheck);
      for (const row of currentRowsToCheck) {
        const blocksOnRow = getBlocksOccupyingRow(updatedBlocks, row);

        for (const block of blocksOnRow) {
          if (!connectedBlockIds.has(block.id)) {
            connectedBlockIds.add(block.id);
            console.log(`    블록 ${block.id} 추가 (행 ${block.row}에서 발견)`);

            // 이 블록이 멀티행이면, 차지하는 다른 행들도 추가
            const blockRows = calculateRows(block.height || ROW_HEIGHT);
            if (blockRows > 1) {
              for (let i = 0; i < blockRows; i++) {
                const newRow = block.row + i;
                if (!rowsToCheck.has(newRow)) {
                  rowsToCheck.add(newRow);
                  console.log(`      → 행 ${newRow} 추가 (블록이 ${blockRows}행 차지)`);
                }
              }
            }
          }
        }
      }
    }

    console.log(`  연결된 블록 ID:`, Array.from(connectedBlockIds));
    console.log(`  영향받는 행:`, Array.from(rowsToCheck).sort((a, b) => a - b));

    // 3단계: 연결된 모든 블록을 colStart 순서대로 정렬하여 순서 결정
    // 중요: 타겟 행에만 있는 블록이 아니라, 연결된 모든 블록을 포함해야 함
    const connectedBlocks = updatedBlocks.filter(b => connectedBlockIds.has(b.id));

    // colStart로 정렬 (왼쪽부터 오른쪽 순서)
    connectedBlocks.sort((a, b) => a.colStart - b.colStart);

    console.log(`  연결된 블록들 (정렬됨):`, connectedBlocks.map(b => ({
      id: b.id,
      row: b.row,
      colStart: b.colStart,
      colSpan: b.colSpan
    })));

    // 드롭되는 블록을 insertIndex 위치에 삽입
    // insertIndex는 occupyingBlocks 기준이므로, 연결된 블록들 중에서 타겟 블록의 위치를 찾아야 함
    const targetBlockIndexInConnected = connectedBlocks.findIndex(b => b.id === targetBlock.id);

    let finalInsertIndex: number;
    if (targetBlockIndexInConnected === -1) {
      // 타겟 블록이 연결된 블록에 없으면 (이론상 불가능) 맨 끝에 추가
      finalInsertIndex = connectedBlocks.length;
    } else {
      // position이 'left'면 타겟 앞에, 'right'면 타겟 뒤에
      finalInsertIndex = position === 'left' ? targetBlockIndexInConnected : targetBlockIndexInConnected + 1;
    }

    console.log(`  드롭 블록 삽입 위치: ${finalInsertIndex} (타겟 블록 인덱스: ${targetBlockIndexInConnected}, position: ${position})`);

    const blocksInOrder = [
      ...connectedBlocks.slice(0, finalInsertIndex),
      { ...draggedBlock, row: adjustedTargetRow, colStart: 0, colSpan: 1 }, // 임시값
      ...connectedBlocks.slice(finalInsertIndex)
    ];

    // 4단계: 열 균등 분배 계산
    const totalBlocksInFirstRow = blocksInOrder.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocksInFirstRow);
    const remainder = GRID_COLS % totalBlocksInFirstRow;

    console.log(`  전체 연결된 블록 수: ${totalBlocksInFirstRow}, 평균 colSpan: ${avgColSpan}`);

    // 5단계: 모든 블록에 colSpan 할당
    // blocksInOrder에는 이미 연결된 모든 블록이 포함되어 있으므로, 순서대로 열 할당만 하면 됨
    let currentColStart = 0;
    const blockColSpans = new Map<string, { colStart: number; colSpan: number }>();

    // 연결된 모든 블록들 순서대로 열 할당
    blocksInOrder.forEach((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);
      blockColSpans.set(block.id, {
        colStart: currentColStart,
        colSpan: colSpan
      });
      currentColStart += colSpan;
    });

    console.log(`  블록별 열 할당:`, Array.from(blockColSpans.entries()).map(([id, { colStart, colSpan }]) => ({
      id,
      colStart,
      colSpan
    })));

    // 6단계: 모든 블록들(연결된 블록 + occupyingBlocks)에 일관된 colSpan 적용
    const movedBlock = {
      ...draggedBlock,
      row: adjustedTargetRow,
      colStart: blockColSpans.get(draggedBlock.id)!.colStart,
      colSpan: blockColSpans.get(draggedBlock.id)!.colSpan
    };

    // occupyingBlocks에 있는 모든 블록 ID 수집
    const occupyingBlockIds = new Set(occupyingBlocks.map(b => b.id));

    // 연결된 블록 + occupyingBlocks의 합집합
    const allAffectedIds = new Set([...connectedBlockIds, ...occupyingBlockIds]);

    // 모든 영향받는 블록 업데이트
    const updatedAffectedBlocks = updatedBlocks
      .filter(b => allAffectedIds.has(b.id))
      .map(block => {
        const assignment = blockColSpans.get(block.id);
        if (assignment) {
          return {
            ...block,
            colStart: assignment.colStart,
            colSpan: assignment.colSpan
          };
        }
        return block;
      });

    // 7단계: finalBlocks 구성
    const finalBlocks = [
      ...updatedBlocks.filter(b => !allAffectedIds.has(b.id)),
      ...updatedAffectedBlocks,
      movedBlock
    ];

    console.log(`✅ 멀티행 블록 배치 완료 - 최종: row=${movedBlock.row}, colStart=${movedBlock.colStart}, colSpan=${movedBlock.colSpan}`);

    return finalBlocks;
  } else {
    // 싱글행 블록인 경우 기존 로직 사용 (타겟 행만 재분배)
    console.log(`📍 싱글행 블록 배치 - 행 ${adjustedTargetRow} 재분배`);

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
