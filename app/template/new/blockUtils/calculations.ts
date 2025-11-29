import { ROW_HEIGHT, ROW_GAP } from './constants';

// 블록 높이로부터 차지하는 행 수 계산
export const calculateRows = (height: number): number => {
  return Math.ceil((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP));
};
