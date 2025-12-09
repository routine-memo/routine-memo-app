import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/db/users';
import { calculateCohortData } from '@/lib/retention/calculateCohortData';
import type { PeriodType } from '@/lib/retention/types';

export async function GET(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 기간 타입 가져오기
    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || 'weekly';

    // 유효한 기간 타입인지 확인
    const validPeriods: PeriodType[] = ['daily', 'weekly', 'monthly'];
    const periodType: PeriodType = validPeriods.includes(periodParam as PeriodType)
      ? (periodParam as PeriodType)
      : 'weekly';

    // 코호트 데이터 계산
    const cohortData = await calculateCohortData(periodType);

    return NextResponse.json(cohortData);
  } catch (error) {
    console.error('Failed to fetch retention data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
