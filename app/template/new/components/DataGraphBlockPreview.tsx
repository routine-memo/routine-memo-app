'use client';

import { LineChart } from 'lucide-react';
import { DataGraphBlockDefault } from '../types';

interface DataGraphBlockPreviewProps {
  value?: DataGraphBlockDefault;
}

export const DataGraphBlockPreview = ({ value }: DataGraphBlockPreviewProps) => {
  const fields = value?.fields || [];

  // 항목이 없는 경우
  if (fields.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <LineChart className="w-6 h-6 mb-0.5" />
        <span className="text-[9px]">항목 없음</span>
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
              {field.unit}
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
