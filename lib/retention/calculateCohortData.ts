import { db } from '@/lib/db';
import { users, entries, dailyEntries } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import type { CohortData, CohortRow } from './types';

// 주의 시작일 계산 (월요일 기준)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ISO 형식 날짜 문자열 반환
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 두 날짜 사이의 주차 수 계산
function getWeeksDifference(startDate: Date, endDate: Date): number {
  const start = getWeekStart(startDate);
  const end = getWeekStart(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

interface UserActivity {
  userId: string;
  createdAt: Date;
  activityDates: Date[];
}

export async function calculateCohortData(): Promise<CohortData> {
  // 모든 사용자 조회
  const allUsers = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
    })
    .from(users);

  if (allUsers.length === 0) {
    return { rows: [], maxWeeks: 0 };
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

  // 사용자별 활동 날짜 맵 생성
  const userActivityMap = new Map<string, Set<string>>();

  for (const user of allUsers) {
    userActivityMap.set(user.id, new Set());
  }

  // entries 활동 추가
  for (const activity of entryActivities) {
    const weekStart = formatDate(getWeekStart(activity.createdAt));
    userActivityMap.get(activity.userId)?.add(weekStart);
  }

  // dailyEntries 활동 추가
  for (const activity of dailyActivities) {
    const weekStart = formatDate(getWeekStart(activity.createdAt));
    userActivityMap.get(activity.userId)?.add(weekStart);
  }

  // 코호트별로 사용자 그룹화
  const cohortMap = new Map<string, { users: { id: string; activityWeeks: Set<string> }[] }>();

  for (const user of allUsers) {
    const cohortWeek = formatDate(getWeekStart(user.createdAt));

    if (!cohortMap.has(cohortWeek)) {
      cohortMap.set(cohortWeek, { users: [] });
    }

    cohortMap.get(cohortWeek)!.users.push({
      id: user.id,
      activityWeeks: userActivityMap.get(user.id) || new Set(),
    });
  }

  // 현재 주 계산
  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  // 코호트 데이터 생성
  const rows: CohortRow[] = [];
  let maxWeeks = 0;

  // 코호트를 날짜순으로 정렬 (최신순)
  const sortedCohorts = Array.from(cohortMap.entries()).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  for (const [cohortWeek, { users: cohortUsers }] of sortedCohorts) {
    const cohortStartDate = new Date(cohortWeek);
    const weeksSinceCohort = getWeeksDifference(cohortStartDate, currentWeekStart);

    if (weeksSinceCohort + 1 > maxWeeks) {
      maxWeeks = weeksSinceCohort + 1;
    }

    const retentionByWeek: number[] = [];

    // 각 주차별 재방문률 계산
    for (let week = 0; week <= weeksSinceCohort; week++) {
      const targetWeekDate = new Date(cohortStartDate);
      targetWeekDate.setDate(targetWeekDate.getDate() + week * 7);
      const targetWeekStr = formatDate(getWeekStart(targetWeekDate));

      let activeCount = 0;
      for (const user of cohortUsers) {
        if (user.activityWeeks.has(targetWeekStr)) {
          activeCount++;
        }
      }

      const retention = cohortUsers.length > 0
        ? Math.round((activeCount / cohortUsers.length) * 100)
        : 0;
      retentionByWeek.push(retention);
    }

    rows.push({
      cohortWeek,
      totalUsers: cohortUsers.length,
      retentionByWeek,
    });
  }

  return { rows, maxWeeks };
}
