import { BlockPosition } from '../types';
import { getBlocksOccupyingRow } from './queries';
import { calculateRows } from './calculations';
import { GRID_COLS, ROW_HEIGHT } from './constants';

// 블록 삽입/삭제 시 전체 블록들 재정렬
export const redistributeRow = (
  blocks: BlockPosition[],
  row: number,
  insertedBlock?: BlockPosition
): BlockPosition[] => {
  console.log(`🔄 redistributeRow 시작 - 행 ${row}`);

  // 🔑 핵심 변경: 연결된 블록만이 아닌, 전체 블록을 재분배
  // 모든 블록이 차지하는 모든 행을 수집
  const allRows = new Set<number>();
  blocks.forEach(block => {
    const blockRows = calculateRows(block.height || ROW_HEIGHT);
    for (let i = 0; i < blockRows; i++) {
      allRows.add(block.row + i);
    }
  });

  console.log(`  전체 블록: ${blocks.length}개`);
  console.log(`  영향받는 행: ${allRows.size}개`, Array.from(allRows).sort((a, b) => a - b));

  // 각 행별로 독립적으로 재분배
  // 🔑 핵심: 각 행에서 차지하는 블록들끼리만 열을 나눠가짐
  const blockAssignments = new Map<string, { colStart: number; colSpan: number }>();

  console.log(`  📊 전체 ${allRows.size}개 행 각각 재분배 시작`);

  for (const affectedRow of Array.from(allRows).sort((a, b) => a - b)) {
    // 이 행을 차지하는 모든 블록
    const rowOccupyingBlocks = getBlocksOccupyingRow(blocks, affectedRow);

    // 아직 재분배 안된 블록들만
    const blocksToRedistribute = rowOccupyingBlocks.filter(b => !blockAssignments.has(b.id));

    if (blocksToRedistribute.length === 0) {
      console.log(`    행 ${affectedRow}: 모든 블록 이미 재분배됨, 스킵`);
      continue;
    }

    // 이 행의 블록들을 6열에 균등 분배
    const totalBlocks = blocksToRedistribute.length;
    const avgColSpan = Math.floor(GRID_COLS / totalBlocks);
    const remainder = GRID_COLS % totalBlocks;

    console.log(`    행 ${affectedRow}: ${totalBlocks}개 블록을 ${GRID_COLS}열에 재분배`);

    let currentColStart = 0;
    blocksToRedistribute.forEach((block, index) => {
      const colSpan = avgColSpan + (index < remainder ? 1 : 0);
      blockAssignments.set(block.id, { colStart: currentColStart, colSpan });
      console.log(`      블록 ${block.id}: colStart=${currentColStart}, colSpan=${colSpan}`);
      currentColStart += colSpan;
    });
  }

  // 재분배 결과 적용
  const result = blocks.map(block => {
    const assignment = blockAssignments.get(block.id);
    if (!assignment) {
      console.warn(`⚠️ 블록 ${block.id}의 할당 정보 없음 (원본 유지)`);
      return block;
    }
    return {
      ...block,
      colStart: assignment.colStart,
      colSpan: assignment.colSpan
    };
  });

  console.log(`✅ redistributeRow 완료 - 전체 ${blocks.length}개 블록 재분배`);

  return result;
};
