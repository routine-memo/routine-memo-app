import { db } from '@/lib/db';
import { users, entries, dailyEntries } from '@/lib/db/schema';
import type { CohortData, CohortRow, PeriodType } from './types';

// 주의 시작일 계산 (월요일 기준)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 월의 시작일 계산
function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 일의 시작 계산
function getDayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 기간 타입에 따른 시작일 계산
function getPeriodStart(date: Date, periodType: PeriodType): Date {
  switch (periodType) {
    case 'daily':
      return getDayStart(date);
    case 'weekly':
      return getWeekStart(date);
    case 'monthly':
      return getMonthStart(date);
  }
}

// ISO 형식 날짜 문자열 반환
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 두 날짜 사이의 기간 수 계산
function getPeriodsDifference(startDate: Date, endDate: Date, periodType: PeriodType): number {
  const start = getPeriodStart(startDate, periodType);
  const end = getPeriodStart(endDate, periodType);
  const diffMs = end.getTime() - start.getTime();

  switch (periodType) {
    case 'daily':
      return Math.floor(diffMs / (24 * 60 * 60 * 1000));
    case 'weekly':
      return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    case 'monthly': {
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      return (endYear - startYear) * 12 + (endMonth - startMonth);
    }
  }
}

// N 기간 후의 날짜 계산
function addPeriods(date: Date, periods: number, periodType: PeriodType): Date {
  const d = new Date(date);
  switch (periodType) {
    case 'daily':
      d.setDate(d.getDate() + periods);
      break;
    case 'weekly':
      d.setDate(d.getDate() + periods * 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + periods);
      break;
  }
  return d;
}

export async function calculateCohortData(periodType: PeriodType = 'weekly'): Promise<CohortData> {
  // 모든 사용자 조회
  const allUsers = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
    })
    .from(users);

  if (allUsers.length === 0) {
    return { rows: [], maxPeriods: 0, periodType };
  }

  // entries와 dailyEntries에서 활동 날짜 조회
  const [entryActivities, dailyActivities] = await Promise.all([
    db
      .select({
        userId: entries.userId,
        createdAt: entries.createdAt,
      })
      .from(entries),
    db
      .select({
        userId: dailyEntries.userId,
        createdAt: dailyEntries.createdAt,
      })
      .from(dailyEntries),
  ]);

  // 사용자별 활동 기간 맵 생성
  const userActivityMap = new Map<string, Set<string>>();

  for (const user of allUsers) {
    userActivityMap.set(user.id, new Set());
  }

  // entries 활동 추가
  for (const activity of entryActivities) {
    const periodStart = formatDate(getPeriodStart(activity.createdAt, periodType));
    userActivityMap.get(activity.userId)?.add(periodStart);
  }

  // dailyEntries 활동 추가
  for (const activity of dailyActivities) {
    const periodStart = formatDate(getPeriodStart(activity.createdAt, periodType));
    userActivityMap.get(activity.userId)?.add(periodStart);
  }

  // 코호트별로 사용자 그룹화
  const cohortMap = new Map<string, { users: { id: string; activityPeriods: Set<string> }[] }>();

  for (const user of allUsers) {
    const cohortPeriod = formatDate(getPeriodStart(user.createdAt, periodType));

    if (!cohortMap.has(cohortPeriod)) {
      cohortMap.set(cohortPeriod, { users: [] });
    }

    cohortMap.get(cohortPeriod)!.users.push({
      id: user.id,
      activityPeriods: userActivityMap.get(user.id) || new Set(),
    });
  }

  // 현재 기간 계산
  const now = new Date();
  const currentPeriodStart = getPeriodStart(now, periodType);

  // 코호트 데이터 생성
  const rows: CohortRow[] = [];
  let maxPeriods = 0;

  // 코호트를 날짜순으로 정렬 (최신순)
  const sortedCohorts = Array.from(cohortMap.entries()).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  for (const [cohortPeriod, { users: cohortUsers }] of sortedCohorts) {
    const cohortStartDate = new Date(cohortPeriod);
    const periodsSinceCohort = getPeriodsDifference(cohortStartDate, currentPeriodStart, periodType);

    if (periodsSinceCohort + 1 > maxPeriods) {
      maxPeriods = periodsSinceCohort + 1;
    }

    const retentionByPeriod: number[] = [];

    // 각 기간별 재방문률 계산
    for (let period = 0; period <= periodsSinceCohort; period++) {
      const targetPeriodDate = addPeriods(cohortStartDate, period, periodType);
      const targetPeriodStr = formatDate(getPeriodStart(targetPeriodDate, periodType));

      let activeCount = 0;
      for (const user of cohortUsers) {
        if (user.activityPeriods.has(targetPeriodStr)) {
          activeCount++;
        }
      }

      const retention = cohortUsers.length > 0
        ? Math.round((activeCount / cohortUsers.length) * 100)
        : 0;
      retentionByPeriod.push(retention);
    }

    rows.push({
      cohortPeriod,
      totalUsers: cohortUsers.length,
      retentionByPeriod,
    });
  }

  return { rows, maxPeriods, periodType };
}
