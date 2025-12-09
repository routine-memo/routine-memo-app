// 코호트 분석을 위한 타입 정의

export interface CohortRow {
  cohortWeek: string;       // "2024-01-01" (주의 시작일, ISO 형식)
  totalUsers: number;       // 해당 주에 가입한 사용자 수
  retentionByWeek: number[]; // [Week0%, Week1%, Week2%, ...] 재방문률 (0-100)
}

export interface CohortData {
  rows: CohortRow[];
  maxWeeks: number;         // 가장 오래된 코호트의 주차 수
}
