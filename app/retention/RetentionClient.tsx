'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CohortData } from '@/lib/retention/types';
import './RetentionClient.css';

export function RetentionClient() {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/retention', {
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
  }, []);

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

  return (
    <div className="retention-container">
      <h1 className="retention-title">코호트 리텐션 분석</h1>
      <p className="retention-description">
        사용자 가입 주차별 재방문률 (%)
      </p>

      <div className="retention-table-wrapper">
        <table className="retention-table">
          <thead>
            <tr>
              <th className="retention-header-cell">코호트</th>
              <th className="retention-header-cell">사용자</th>
              {Array.from({ length: data.maxWeeks }, (_, i) => (
                <th key={i} className="retention-header-cell">
                  Week {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.cohortWeek}>
                <td className="retention-cohort-cell">
                  {formatCohortWeek(row.cohortWeek)}
                </td>
                <td className="retention-users-cell">{row.totalUsers}</td>
                {Array.from({ length: data.maxWeeks }, (_, weekIndex) => {
                  const value = row.retentionByWeek[weekIndex];
                  const hasValue = weekIndex < row.retentionByWeek.length;

                  return (
                    <td
                      key={weekIndex}
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

      <div className="retention-legend">
        <span className="retention-legend-title">범례:</span>
        <div className="retention-legend-items">
          <div className="retention-legend-item">
            <div
              className="retention-legend-color"
              style={{ backgroundColor: getRetentionColor(100) }}
            />
            <span>100%</span>
          </div>
          <div className="retention-legend-item">
            <div
              className="retention-legend-color"
              style={{ backgroundColor: getRetentionColor(75) }}
            />
            <span>75%</span>
          </div>
          <div className="retention-legend-item">
            <div
              className="retention-legend-color"
              style={{ backgroundColor: getRetentionColor(50) }}
            />
            <span>50%</span>
          </div>
          <div className="retention-legend-item">
            <div
              className="retention-legend-color"
              style={{ backgroundColor: getRetentionColor(25) }}
            />
            <span>25%</span>
          </div>
          <div className="retention-legend-item">
            <div
              className="retention-legend-color"
              style={{ backgroundColor: getRetentionColor(0) }}
            />
            <span>0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 코호트 주차 포맷팅
function formatCohortWeek(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
