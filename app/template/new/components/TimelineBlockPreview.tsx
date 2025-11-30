'use client';

import { TimelineBlockDefault, TimelineItem, TimelineRowSpan } from '../types';

interface TimelineBlockPreviewProps {
  value?: TimelineBlockDefault;
}

const TOTAL_COLS = 5;

// 아이템의 첫 번째 행 가져오기 (정렬용)
const getFirstRow = (item: TimelineItem): TimelineRowSpan | null => {
  if (item.rows.length === 0) return null;
  const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
  return sortedRows[0];
};

// 일정이 있는 시간대만 추출 (틈새 제외)
const getActiveHours = (items: TimelineItem[]): number[] => {
  const hoursSet = new Set<number>();

  items.forEach(item => {
    item.rows.forEach(row => {
      hoursSet.add(row.hour);
    });
  });

  // 정렬된 배열로 반환
  return Array.from(hoursSet).sort((a, b) => a - b);
};

export const TimelineBlockPreview = ({ value }: TimelineBlockPreviewProps) => {
  const items = value?.items || [];

  // 일정을 시간순으로 정렬
  const sortedItems = [...items].sort((a, b) => {
    const aFirst = getFirstRow(a);
    const bFirst = getFirstRow(b);
    if (!aFirst || !bFirst) return 0;
    if (aFirst.hour !== bFirst.hour) return aFirst.hour - bFirst.hour;
    return aFirst.startCol - bFirst.startCol;
  });

  if (items.length === 0) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden flex flex-col items-center justify-center bg-gray-50 p-2">
        <div className="text-gray-300 text-xs">일정 없음</div>
      </div>
    );
  }

  // 요약뷰: 일정이 있는 시간대만 추출 (틈새 없이)
  const activeHours = getActiveHours(items);
  const totalActiveHours = activeHours.length;

  // 시간 -> 표시 인덱스 매핑
  const hourToIndex = new Map<number, number>();
  activeHours.forEach((hour, idx) => {
    hourToIndex.set(hour, idx);
  });

  return (
    <div className="h-full w-full rounded-xl overflow-hidden flex bg-white p-1">
      {/* 요약 타임라인 */}
      <div className="flex-1 relative">
        {/* 시간 레이블들 - 왼쪽에 세로로 배치 */}
        <div className="absolute left-0 top-0 bottom-0 w-[14%] flex flex-col justify-between py-0.5">
          {activeHours.map((hour, idx) => (
            <span key={hour} className="text-[7px] text-gray-400 ml-0.5 font-medium leading-none">
              {hour}
            </span>
          ))}
          {/* 마지막 시간+1 표시 (끝 시간) */}
          {activeHours.length > 0 && (
            <span className="text-[7px] text-gray-400 ml-0.5 font-medium leading-none">
              {activeHours[activeHours.length - 1] + 1}
            </span>
          )}
        </div>

        {/* 일정 블록들 - 각 행별로 렌더링 */}
        {sortedItems.map((item) => {
          if (item.rows.length === 0) return null;

          return item.rows.map((row) => {
            const displayIndex = hourToIndex.get(row.hour);
            if (displayIndex === undefined) return null;

            const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
            const isFirstRow = row.hour === sortedRows[0].hour;
            const isLastRow = row.hour === sortedRows[sortedRows.length - 1].hour;

            // 이 아이템 내에서 연속된 행인지 확인
            const prevRowInItem = sortedRows.find(r => r.hour === row.hour - 1);
            const nextRowInItem = sortedRows.find(r => r.hour === row.hour + 1);

            // 세로 위치 (요약뷰 기준 - 인덱스 기반)
            const rowTop = (displayIndex / totalActiveHours) * 100;
            const rowHeight = (1 / totalActiveHours) * 100;

            // 가로 위치 (열)
            const colLeft = 14 + (row.startCol / TOTAL_COLS) * 86;
            const colWidth = ((row.endCol - row.startCol) / TOTAL_COLS) * 86;

            return (
              <div
                key={`${item.id}-${row.hour}`}
                className="absolute"
                style={{
                  top: `calc(${rowTop}% + ${!prevRowInItem ? 1 : 0}px)`,
                  height: `calc(${rowHeight}% - ${(!prevRowInItem ? 1 : 0) + (!nextRowInItem ? 1 : 0)}px)`,
                  left: `${colLeft}%`,
                  width: `${colWidth}%`,
                  backgroundColor: item.color,
                  borderTopLeftRadius: isFirstRow ? 3 : 0,
                  borderTopRightRadius: isFirstRow ? 3 : 0,
                  borderBottomLeftRadius: isLastRow ? 3 : 0,
                  borderBottomRightRadius: isLastRow ? 3 : 0,
                }}
              >
                {/* 첫 번째 행에만 제목 표시 */}
                {isFirstRow && (
                  <span className="text-[8px] text-white font-semibold px-1 truncate block leading-tight">
                    {item.title || ''}
                  </span>
                )}
              </div>
            );
          });
        })}

      </div>
    </div>
  );
};
