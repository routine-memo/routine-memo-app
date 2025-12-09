'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CohortData, PeriodType, RetentionChartData } from '@/lib/retention/types';
import './RetentionClient.css';

const PERIOD_LABELS: Record<PeriodType, { name: string; prefix: string }> = {
  daily: { name: '일별', prefix: 'Day' },
  weekly: { name: '주별', prefix: 'Week' },
  monthly: { name: '월별', prefix: 'Month' },
};

export function RetentionClient() {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/retention?period=${periodType}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to fetch retention data');
        }
        const cohortData = await res.json();
        setData(cohortData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [periodType]);

  // 평균 리텐션 차트 데이터 계산
  const chartData = useMemo<RetentionChartData[]>(() => {
    if (!data || data.rows.length === 0) return [];

    const result: RetentionChartData[] = [];

    for (let period = 0; period < data.maxPeriods; period++) {
      let totalRetention = 0;
      let totalUsers = 0;
      let cohortCount = 0;

      for (const row of data.rows) {
        if (period < row.retentionByPeriod.length) {
          totalRetention += row.retentionByPeriod[period] * row.totalUsers;
          totalUsers += row.totalUsers;
          cohortCount++;
        }
      }

      if (cohortCount > 0) {
        result.push({
          period,
          retention: totalUsers > 0 ? Math.round(totalRetention / totalUsers) : 0,
          userCount: totalUsers,
        });
      }
    }

    return result;
  }, [data]);

  if (loading) {
    return (
      <div className="retention-loading">
        <Loader2 className="retention-spinner" />
        <span>리텐션 데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="retention-error">
        <p>오류: {error}</p>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="retention-empty">
        <p>아직 데이터가 없습니다.</p>
      </div>
    );
  }

  const periodLabel = PERIOD_LABELS[periodType];

  return (
    <div className="retention-container">
      <div className="retention-header">
        <div>
          <h1 className="retention-title">코호트 리텐션 분석</h1>
          <p className="retention-description">
            사용자 가입 {periodLabel.name} 재방문률 (%)
          </p>
        </div>

        {/* 기간 필터 */}
        <div className="retention-filter">
          {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((type) => (
            <button
              key={type}
              className={`retention-filter-btn ${periodType === type ? 'active' : ''}`}
              onClick={() => setPeriodType(type)}
            >
              {PERIOD_LABELS[type].name}
            </button>
          ))}
        </div>
      </div>

      {/* 리텐션 선형 그래프 */}
      {chartData.length > 0 && (
        <div className="retention-chart-wrapper">
          <h2 className="retention-chart-title">평균 리텐션 추이</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="period"
                tickFormatter={(value) => `${periodLabel.prefix} ${value}`}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, '평균 리텐션']}
                labelFormatter={(label) => `${periodLabel.prefix} ${label}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="retention"
                stroke="#0066CC"
                strokeWidth={2}
                dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 코호트 테이블 */}
      <div className="retention-table-wrapper">
        <table className="retention-table">
          <thead>
            <tr>
              <th className="retention-header-cell">코호트</th>
              <th className="retention-header-cell">사용자</th>
              {Array.from({ length: data.maxPeriods }, (_, i) => (
                <th key={i} className="retention-header-cell">
                  {periodLabel.prefix} {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.cohortPeriod}>
                <td className="retention-cohort-cell">
                  {formatCohortPeriod(row.cohortPeriod, periodType)}
                </td>
                <td className="retention-users-cell">{row.totalUsers}</td>
                {Array.from({ length: data.maxPeriods }, (_, periodIndex) => {
                  const value = row.retentionByPeriod[periodIndex];
                  const hasValue = periodIndex < row.retentionByPeriod.length;

                  return (
                    <td
                      key={periodIndex}
                      className="retention-value-cell"
                      style={{
                        backgroundColor: hasValue
                          ? getRetentionColor(value)
                          : 'transparent',
                        color: hasValue && value >= 50 ? 'white' : 'inherit',
                      }}
                    >
                      {hasValue ? `${value}%` : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="retention-legend">
        <span className="retention-legend-title">범례:</span>
        <div className="retention-legend-items">
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="retention-legend-item">
              <div
                className="retention-legend-color"
                style={{ backgroundColor: getRetentionColor(value) }}
              />
              <span>{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 코호트 기간 포맷팅
function formatCohortPeriod(dateStr: string, periodType: PeriodType): string {
  const date = new Date(dateStr);

  switch (periodType) {
    case 'daily':
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    case 'weekly':
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'monthly':
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
      });
  }
}

// 재방문률에 따른 색상 반환
function getRetentionColor(value: number): string {
  if (value >= 80) return '#0066CC';
  if (value >= 60) return '#3385D6';
  if (value >= 40) return '#66A3E0';
  if (value >= 20) return '#99C2EB';
  if (value > 0) return '#CCE0F5';
  return '#E5E7EB';
}
