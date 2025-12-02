'use client';

import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { Target, Calendar, Percent } from 'lucide-react';
import { ProgressBlockDefault, ProgressMode } from '../types';

interface ProgressBlockEditorProps {
  initialValue?: ProgressBlockDefault;
  onChange: (value: ProgressBlockDefault) => void;
}

export interface ProgressBlockEditorHandle {
  save: () => Promise<void>;
}

const ProgressBlockEditorInner = forwardRef<ProgressBlockEditorHandle, ProgressBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const [mode, setMode] = useState<ProgressMode>(initialValue?.mode || 'dday');
    const [title, setTitle] = useState(initialValue?.title || '');
    const [targetDate, setTargetDate] = useState(initialValue?.targetDate || '');
    const [currentValue, setCurrentValue] = useState(initialValue?.currentValue ?? 0);
    const [targetValue, setTargetValue] = useState(initialValue?.targetValue ?? 100);

    // onChange를 ref로 감싸서 무한 루프 방지
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 변경사항 전파
    useEffect(() => {
      onChangeRef.current({
        mode,
        title,
        targetDate,
        currentValue,
        targetValue,
      });
    }, [mode, title, targetDate, currentValue, targetValue]);

    // 저장 핸들러
    useImperativeHandle(ref, () => ({
      save: async () => {
        // 현재 상태가 이미 onChange로 전파됨
      },
    }));

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

    return (
      <div className="h-full flex flex-col bg-white p-4 overflow-auto">
        {/* 모드 선택 */}
        <div className="flex-none mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            측정 방식
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('dday')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                mode === 'dday'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">D-Day</span>
            </button>
            <button
              onClick={() => setMode('percent')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                mode === 'percent'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Percent className="w-5 h-5" />
              <span className="font-medium">달성률</span>
            </button>
          </div>
        </div>

        {/* 목표 제목 */}
        <div className="flex-none mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            목표 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 턱걸이 100개, 책 10권 읽기"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* D-Day 모드 설정 */}
        {mode === 'dday' && (
          <div className="flex-none mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              목표 날짜
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {dday !== null && (
              <p className="mt-2 text-sm text-gray-500">
                {dday === 0
                  ? '오늘이 D-Day입니다!'
                  : dday > 0
                  ? `D-${dday} (${dday}일 남음)`
                  : `D+${Math.abs(dday)} (${Math.abs(dday)}일 지남)`}
              </p>
            )}
          </div>
        )}

        {/* 퍼센트 모드 설정 */}
        {mode === 'percent' && (
          <>
            <div className="flex-none mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  현재 값
                </label>
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  목표 값
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 진행률 미리보기 */}
            <div className="flex-none mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">진행률</span>
                <span className="text-sm font-medium text-amber-600">{percent}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {currentValue} / {targetValue}
              </p>
            </div>
          </>
        )}

        {/* 미리보기 */}
        <div className="flex-1 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            미리보기
          </label>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-gray-800">
                {title || '목표를 입력하세요'}
              </span>
            </div>
            {mode === 'dday' ? (
              <div className="text-center py-4">
                <span className="text-4xl font-bold text-amber-600">
                  {dday !== null
                    ? dday === 0
                      ? 'D-Day'
                      : dday > 0
                      ? `D-${dday}`
                      : `D+${Math.abs(dday)}`
                    : 'D-?'}
                </span>
                {targetDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(targetDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-amber-600">{percent}%</span>
                  <span className="text-sm text-gray-500">
                    {currentValue}/{targetValue}
                  </span>
                </div>
                <div className="w-full h-4 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProgressBlockEditorInner.displayName = 'ProgressBlockEditorInner';

export const ProgressBlockEditor = forwardRef<ProgressBlockEditorHandle, ProgressBlockEditorProps>(
  (props, ref) => {
    return <ProgressBlockEditorInner {...props} ref={ref} />;
  }
);

ProgressBlockEditor.displayName = 'ProgressBlockEditor';
