import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/db/users';
import { calculateCohortData } from '@/lib/retention/calculateCohortData';

export async function GET() {
  try {
    // 인증 체크
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 코호트 데이터 계산
    const cohortData = await calculateCohortData();

    return NextResponse.json(cohortData);
  } catch (error) {
    console.error('Failed to fetch retention data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
