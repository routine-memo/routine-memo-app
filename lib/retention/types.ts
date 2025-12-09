// 코호트 분석을 위한 타입 정의

export type PeriodType = 'daily' | 'weekly' | 'monthly';

export interface CohortRow {
  cohortPeriod: string;       // 기간 시작일 (ISO 형식)
  totalUsers: number;         // 해당 기간에 가입한 사용자 수
  retentionByPeriod: number[]; // [Period0%, Period1%, ...] 재방문률 (0-100)
}

export interface CohortData {
  rows: CohortRow[];
  maxPeriods: number;         // 가장 오래된 코호트의 기간 수
  periodType: PeriodType;     // 현재 기간 타입
}

// 차트용 평균 리텐션 데이터
export interface RetentionChartData {
  period: number;             // Period 0, 1, 2, ...
  retention: number;          // 평균 재방문률 (%)
  userCount: number;          // 해당 기간에 데이터가 있는 코호트의 총 사용자 수
}
