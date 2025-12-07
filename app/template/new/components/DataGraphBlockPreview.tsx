'use client';

import { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { DataGraphBlockDefault, DataGraphField, DataGraphValue } from '../types';
import { getEntriesByAlbum } from '@/lib/storage/entry';

interface DataGraphBlockPreviewProps {
  value?: DataGraphBlockDefault;
  albumId?: string;   // 앨범 ID (누적 데이터 조회용)
  blockId?: string;   // 블록 ID (해당 블록의 데이터만 조회)
  entryDate?: string; // 현재 기록의 날짜 (이 날짜까지의 데이터만 표시)
}

// 데이터 포인트 타입
interface DataPoint {
  date: string;
  values: Map<string, number>;
}

export const DataGraphBlockPreview = ({ value, albumId, blockId, entryDate }: DataGraphBlockPreviewProps) => {
  const fields = value?.fields || [];
  const currentValues = value?.values || [];

  // 앨범의 모든 기록에서 이 블록의 데이터 수집 (시간순)
  // entryDate가 있으면 해당 날짜까지의 데이터만 표시
  const historicalData = useMemo((): DataPoint[] => {
    if (!albumId || !blockId) return [];

    const entries = getEntriesByAlbum(albumId);
    // 시간순 정렬 (오래된 것 → 최신)
    let sortedEntries = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // entryDate가 있으면 해당 날짜 이전의 기록만 필터링
    if (entryDate) {
      const entryDateTime = new Date(entryDate).getTime();
      sortedEntries = sortedEntries.filter(
        entry => new Date(entry.createdAt).getTime() <= entryDateTime
      );
    }

    const dataPoints: DataPoint[] = [];

    for (const entry of sortedEntries) {
      const blockValue = entry.blockValues.find(bv => bv.blockId === blockId);
      if (blockValue?.value?.type === 'dataGraph' && blockValue.value.value.values) {
        const valuesMap = new Map<string, number>();
        blockValue.value.value.values.forEach(v => {
          valuesMap.set(v.fieldId, v.value);
        });
        if (valuesMap.size > 0) {
          dataPoints.push({
            date: entry.createdAt,
            values: valuesMap,
          });
        }
      }
    }

    return dataPoints;
  }, [albumId, blockId, entryDate]);

  // 현재 입력중인 값도 포함한 전체 데이터
  // entryDate가 있으면 이미 저장된 기록을 보는 것이므로 currentValues 무시
  const allDataPoints = useMemo(() => {
    // entryDate가 있으면 historicalData만 사용 (이미 해당 기록까지 포함됨)
    if (entryDate) return historicalData;

    if (currentValues.length === 0) return historicalData;

    const currentMap = new Map<string, number>();
    currentValues.forEach(v => currentMap.set(v.fieldId, v.value));

    return [
      ...historicalData,
      { date: 'current', values: currentMap }
    ];
  }, [historicalData, currentValues, entryDate]);

  // 항목이 없는 경우
  if (fields.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <LineChart className="w-6 h-6 mb-0.5" />
        <span className="text-[9px]">항목 없음</span>
      </div>
    );
  }

  // 데이터가 있는 경우 - 선형 그래프 표시
  if (allDataPoints.length > 0) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden flex flex-col bg-white p-2">
        {/* 헤더 */}
        <div className="flex-none flex items-center gap-1 mb-1">
          <LineChart className="w-3 h-3 text-gray-400" />
          <span className="text-[8px] text-gray-400">
            {allDataPoints.length}개 기록
          </span>
        </div>

        {/* 선형 그래프 */}
        <div className="flex-1 min-h-0">
          <MiniLineChart
            fields={fields}
            dataPoints={allDataPoints}
          />
        </div>

        {/* 범례 */}
        <div className="flex-none flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
          {fields.slice(0, 3).map((field) => (
            <div key={field.id} className="flex items-center gap-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: field.color }}
              />
              <span className="text-[7px] text-gray-500 truncate max-w-[40px]">
                {field.name}
              </span>
            </div>
          ))}
          {fields.length > 3 && (
            <span className="text-[7px] text-gray-400">+{fields.length - 3}</span>
          )}
        </div>
      </div>
    );
  }

  // 항목만 정의된 경우 (실제 데이터 없음) - 항목 목록만 표시
  return (
    <div className="h-full w-full rounded-xl overflow-hidden flex flex-col bg-white p-2">
      {/* 안내 문구 */}
      <div className="flex-none flex items-center gap-1 mb-1">
        <LineChart className="w-3 h-3 text-gray-400" />
        <span className="text-[8px] text-gray-400">추적 항목</span>
      </div>

      {/* 항목 목록 */}
      <div className="flex-1 overflow-hidden space-y-1">
        {fields.slice(0, 4).map((field) => (
          <div key={field.id} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-none"
              style={{ backgroundColor: field.color }}
            />
            <span className="text-[9px] text-gray-700 truncate font-medium">
              {field.name}
            </span>
            <span className="text-[8px] text-gray-400 flex-none">
              {field.format === 'percent' ? '%' : '#'}
            </span>
          </div>
        ))}
        {fields.length > 4 && (
          <span className="text-[8px] text-gray-400">
            +{fields.length - 4}개 더
          </span>
        )}
      </div>
    </div>
  );
};

// 미니 선형 그래프 컴포넌트
interface MiniLineChartProps {
  fields: DataGraphField[];
  dataPoints: DataPoint[];
}

function MiniLineChart({ fields, dataPoints }: MiniLineChartProps) {
  if (dataPoints.length === 0) return null;

  // 각 필드별 min/max 계산
  const fieldStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();

    fields.forEach(field => {
      let min = Infinity;
      let max = -Infinity;

      dataPoints.forEach(dp => {
        const val = dp.values.get(field.id);
        if (val !== undefined) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });

      // 데이터가 없거나 모든 값이 같은 경우
      if (min === Infinity) {
        min = 0;
        max = 100;
      } else if (min === max) {
        min = min - 10;
        max = max + 10;
      }

      stats.set(field.id, { min, max });
    });

    return stats;
  }, [fields, dataPoints]);

  // 각 필드별 포인트 위치 계산 (퍼센트 기반)
  const fieldPaths = useMemo(() => {
    const activeFieldCount = fields.length;

    return fields.map((field, fieldIndex) => {
      const stats = fieldStats.get(field.id);
      if (!stats) return null;

      // 퍼센트 기반 좌표 (0-100%)
      const points: { xPercent: number; yPercent: number }[] = [];

      dataPoints.forEach((dp, i) => {
        const val = dp.values.get(field.id);
        if (val !== undefined) {
          let xPercent: number;

          if (dataPoints.length > 1) {
            // 여러 데이터 포인트가 있으면 기존 로직
            xPercent = (i / (dataPoints.length - 1)) * 100;
          } else {
            // 단일 데이터 포인트일 때 필드별로 수평 분산 배치
            if (activeFieldCount === 1) {
              xPercent = 50;
            } else {
              // 필드들을 30% ~ 70% 범위에 균등 배치
              const spacing = 40 / (activeFieldCount - 1);
              xPercent = 30 + (fieldIndex * spacing);
            }
          }

          const yPercent = 100 - ((val - stats.min) / (stats.max - stats.min)) * 100;
          points.push({ xPercent, yPercent });
        }
      });

      if (points.length === 0) return null;

      return {
        field,
        points,
      };
    }).filter(Boolean);
  }, [fields, dataPoints, fieldStats]);

  return (
    <div className="w-full h-full relative">
      {/* SVG 선 그래프 */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {fieldPaths.map((fp) => {
          if (!fp || fp.points.length < 2) return null;

          // SVG path 생성
          const d = fp.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.xPercent} ${p.yPercent}`
          ).join(' ');

          return (
            <path
              key={fp.field.id}
              d={d}
              fill="none"
              stroke={fp.field.color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* 점들 - absolute 포지셔닝으로 원형 유지 */}
      {fieldPaths.map((fp) => {
        if (!fp) return null;

        // 마지막 점만 표시 (또는 단일 점인 경우)
        const lastPoint = fp.points[fp.points.length - 1];

        return (
          <div
            key={fp.field.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: fp.field.color,
              left: `${lastPoint.xPercent}%`,
              top: `${lastPoint.yPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </div>
  );
}
