import { BlockPosition } from '../types';
import { getBlocksOccupyingRow } from './queries';
import { calculateRows } from './calculations';
import { ROW_HEIGHT } from './constants';

// 연결된 블록 추적 (멀티행 블록들이 공유하는 모든 행과 블록을 찾음)
export const findConnectedBlocks = (
  blocks: BlockPosition[],
  initialRows: Set<number>
): { connectedBlockIds: Set<string>; affectedRows: Set<number> } => {
  const connectedBlockIds = new Set<string>();
  const rowsToCheck = new Set(initialRows);

  let previousConnectedSize = 0;
  let previousRowsSize = 0;

  // 재귀적으로 연결된 블록 찾기
  while (connectedBlockIds.size !== previousConnectedSize || rowsToCheck.size !== previousRowsSize) {
    previousConnectedSize = connectedBlockIds.size;
    previousRowsSize = rowsToCheck.size;

    const currentRowsToCheck = Array.from(rowsToCheck);
    for (const row of currentRowsToCheck) {
      const blocksOnRow = getBlocksOccupyingRow(blocks, row);

      for (const block of blocksOnRow) {
        if (!connectedBlockIds.has(block.id)) {
          connectedBlockIds.add(block.id);

          // 멀티행 블록이면 차지하는 다른 행들도 추가
          const blockRows = calculateRows(block.height || ROW_HEIGHT);
          if (blockRows > 1) {
            for (let i = 0; i < blockRows; i++) {
              rowsToCheck.add(block.row + i);
            }
          }
        }
      }
    }
  }

  return { connectedBlockIds, affectedRows: rowsToCheck };
};
