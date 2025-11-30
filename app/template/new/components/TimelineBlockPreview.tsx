'use client';

import { TimelineBlockDefault, TimelineItem, TimelineRowSpan } from '../types';

interface TimelineBlockPreviewProps {
  value?: TimelineBlockDefault;
}

// 시간 범위: 06:00 ~ 24:00 (18시간)
const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TOTAL_COLS = 5;

// 아이템의 첫 번째 행 가져오기 (정렬용)
const getFirstRow = (item: TimelineItem): TimelineRowSpan | null => {
  if (item.rows.length === 0) return null;
  const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
  return sortedRows[0];
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

  return (
    <div className="h-full w-full rounded-xl overflow-hidden flex bg-white p-1">
      {/* 미니 타임라인 (세로 + 가로) */}
      <div className="flex-1 relative">
        {/* 배경 시간 라인 */}
        <div className="absolute inset-0 flex flex-col">
          {[6, 12, 18, 24].map((hour) => (
            <div
              key={hour}
              className="flex-1 border-t border-gray-100 first:border-t-0"
            >
              <span className="text-[6px] text-gray-300 ml-0.5">{hour}</span>
            </div>
          ))}
        </div>

        {/* 일정 블록들 - 각 행별로 렌더링 */}
        {sortedItems.slice(0, 5).map((item) => {
          if (item.rows.length === 0) return null;

          return item.rows.map((row, rowIdx) => {
            const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
            const isFirstRow = row.hour === sortedRows[0].hour;
            const isLastRow = row.hour === sortedRows[sortedRows.length - 1].hour;
            const prevRow = sortedRows.find(r => r.hour === row.hour - 1);
            const nextRow = sortedRows.find(r => r.hour === row.hour + 1);

            // 세로 위치 (시간)
            const rowTop = ((row.hour - START_HOUR) * 60) / (TOTAL_HOURS * 60) * 100;
            const rowHeight = 60 / (TOTAL_HOURS * 60) * 100; // 1시간 = 60분

            // 가로 위치 (열)
            const colLeft = 12 + (row.startCol / TOTAL_COLS) * 88; // 12%는 시간 레이블 공간
            const colWidth = ((row.endCol - row.startCol) / TOTAL_COLS) * 88;

            return (
              <div
                key={`${item.id}-${row.hour}`}
                className="absolute"
                style={{
                  top: `calc(${rowTop}% + ${!prevRow ? 1 : 0}px)`,
                  height: `calc(${rowHeight}% - ${(!prevRow ? 1 : 0) + (!nextRow ? 1 : 0)}px)`,
                  left: `${colLeft}%`,
                  width: `${colWidth}%`,
                  backgroundColor: item.color,
                  borderTopLeftRadius: isFirstRow ? 2 : 0,
                  borderTopRightRadius: isFirstRow ? 2 : 0,
                  borderBottomLeftRadius: isLastRow ? 2 : 0,
                  borderBottomRightRadius: isLastRow ? 2 : 0,
                }}
              >
                {/* 첫 번째 행에만 제목 표시 */}
                {isFirstRow && (
                  <span className="text-[5px] text-white font-medium px-0.5 truncate block leading-tight">
                    {item.title || ''}
                  </span>
                )}
              </div>
            );
          });
        })}

        {/* 남은 일정 수 */}
        {sortedItems.length > 5 && (
          <div className="absolute bottom-0 right-0 text-[6px] text-gray-400 bg-white px-0.5">
            +{sortedItems.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
