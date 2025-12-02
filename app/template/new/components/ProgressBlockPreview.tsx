'use client';

import { Target, Calendar, Percent } from 'lucide-react';
import { ProgressBlockDefault } from '../types';

interface ProgressBlockPreviewProps {
  value?: ProgressBlockDefault;
}

export const ProgressBlockPreview = ({ value }: ProgressBlockPreviewProps) => {
  const mode = value?.mode || 'dday';
  const title = value?.title || '';
  const targetDate = value?.targetDate || '';
  const currentValue = value?.currentValue ?? 0;
  const targetValue = value?.targetValue ?? 100;

  // D-Day 계산
  const calculateDDay = () => {
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 퍼센트 계산
  const calculatePercent = () => {
    if (targetValue === 0) return 0;
    return Math.min(100, Math.round((currentValue / targetValue) * 100));
  };

  const dday = calculateDDay();
  const percent = calculatePercent();

  // 값이 없는 경우
  if (!title && !targetDate && currentValue === 0 && targetValue === 100) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <Target className="w-6 h-6 mb-0.5" />
        <span className="text-[9px]">목표 없음</span>
      </div>
    );
  }

  // D-Day 모드
  if (mode === 'dday') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-2">
        <div className="flex items-center gap-1 mb-1">
          <Calendar className="w-3 h-3 text-amber-500" />
          <span className="text-[8px] text-gray-600 truncate max-w-[70px]">
            {title || '목표'}
          </span>
        </div>
        <span className="text-xl font-bold text-amber-600">
          {dday !== null
            ? dday === 0
              ? 'D-Day'
              : dday > 0
              ? `D-${dday}`
              : `D+${Math.abs(dday)}`
            : 'D-?'}
        </span>
        {targetDate && (
          <span className="text-[7px] text-gray-400 mt-0.5">
            {new Date(targetDate).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    );
  }

  // 퍼센트 모드
  return (
    <div className="h-full w-full flex flex-col justify-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-2">
      <div className="flex items-center gap-1 mb-1">
        <Percent className="w-3 h-3 text-amber-500" />
        <span className="text-[8px] text-gray-600 truncate max-w-[70px]">
          {title || '목표'}
        </span>
      </div>
      <div className="flex items-end justify-between mb-1">
        <span className="text-xl font-bold text-amber-600">{percent}%</span>
        <span className="text-[7px] text-gray-400">
          {currentValue}/{targetValue}
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
