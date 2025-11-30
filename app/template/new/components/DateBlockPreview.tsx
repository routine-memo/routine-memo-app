'use client';

import { Calendar } from 'lucide-react';
import { DateBlockDefault } from '../types';

interface DateBlockPreviewProps {
  date: DateBlockDefault;
}

// 요일 이름 (영문 약어)
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 날짜 파싱
const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const DateBlockPreview = ({ date }: DateBlockPreviewProps) => {
  const parsedDate = parseDate(date.date);

  // 날짜가 없는 경우
  if (!parsedDate) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <Calendar className="w-6 h-6 mb-0.5" />
        <span className="text-[9px]">날짜 없음</span>
      </div>
    );
  }

  const dayOfWeek = parsedDate.getDay();

  return (
    <div
      className="h-full w-full rounded-xl overflow-hidden flex flex-col items-center justify-center p-1.5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,245,240,1) 100%)',
      }}
    >
      {/* 연도 - 작게 */}
      <p className="text-[10px] text-gray-400 font-medium leading-none">
        {parsedDate.getFullYear()}
      </p>
      {/* 월 */}
      <p className="text-[13px] text-gray-500 font-semibold leading-tight">
        {parsedDate.getMonth() + 1}월
      </p>
      {/* 요일 */}
      <p
        className="text-[15px] font-bold leading-tight"
        style={{
          color: dayOfWeek === 0 ? '#FF3B30' :
                 dayOfWeek === 6 ? '#007AFF' : '#FF6B35'
        }}
      >
        {WEEKDAYS_EN[dayOfWeek]}
      </p>
      {/* 일 - 크게 */}
      <p className="text-4xl font-bold text-gray-900 leading-none">
        {parsedDate.getDate()}
      </p>
    </div>
  );
};
