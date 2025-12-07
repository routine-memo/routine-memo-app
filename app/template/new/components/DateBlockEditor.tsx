'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateBlockDefault } from '../types';

interface DateBlockEditorProps {
  initialValue?: DateBlockDefault;
  onChange: (value: DateBlockDefault) => void;
  onSelectComplete?: () => void;  // 날짜 선택 완료 시 호출 (모달 닫기용)
}

export interface DateBlockEditorHandle {
  save: () => Promise<void>;
}

// 요일 이름
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 날짜 파싱
const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// 날짜를 ISO 문자열로 변환
const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 월의 일 수 가져오기
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// 월의 첫째 날 요일 가져오기 (0: 일요일)
const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const DateBlockEditorInner = forwardRef<DateBlockEditorHandle, DateBlockEditorProps>(
  ({ initialValue, onChange, onSelectComplete }, ref) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(
      initialValue?.date || null
    );
    const [viewDate, setViewDate] = useState<Date>(() => {
      if (initialValue?.date) {
        const parsed = parseDate(initialValue.date);
        return parsed || new Date();
      }
      return new Date();
    });

    // onChange를 ref로 관리
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 날짜가 변경될 때 부모에게 알림
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onChangeRef.current({ date: selectedDate });
    }, [selectedDate]);

    // 이전 달로 이동
    const goToPrevMonth = useCallback(() => {
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    // 다음 달로 이동
    const goToNextMonth = useCallback(() => {
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    // 날짜 선택
    const handleDateSelect = useCallback((day: number) => {
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const dateStr = formatDateToISO(newDate);
      setSelectedDate(dateStr);
      // 선택 즉시 저장하고 모달 닫기
      onChange({ date: dateStr });
      onSelectComplete?.();
    }, [viewDate, onChange, onSelectComplete]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ date: selectedDate });
    }, [selectedDate, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    // 캘린더 렌더링 데이터
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    // 선택된 날짜 정보
    const parsedSelectedDate = parseDate(selectedDate);
    const isDateSelected = parsedSelectedDate !== null;

    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* iOS 스타일 날짜 카드 미리보기 */}
        <div className="flex-none p-6 flex justify-center">
          <div
            className="w-48 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
            }}
          >
            {/* 상단 고리 */}
            <div className="relative h-8 flex items-center justify-center gap-12">
              <div className="w-3 h-6 bg-white/90 rounded-full shadow-inner" />
              <div className="w-3 h-6 bg-white/90 rounded-full shadow-inner" />
            </div>

            {/* 날짜 표시 영역 */}
            <div
              className="bg-white/95 mx-2 mb-2 rounded-2xl py-4 px-3 text-center"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,240,240,0.95) 100%)',
              }}
            >
              {isDateSelected && parsedSelectedDate ? (
                <>
                  {/* 연도 - 작게 */}
                  <p className="text-[11px] text-gray-400 font-medium tracking-wider mb-0.5">
                    {parsedSelectedDate.getFullYear()}
                  </p>
                  {/* 월 */}
                  <p className="text-sm text-gray-500 font-semibold mb-1">
                    {parsedSelectedDate.getMonth() + 1}월
                  </p>
                  {/* 요일 */}
                  <p
                    className="text-lg font-bold mb-1"
                    style={{
                      color: parsedSelectedDate.getDay() === 0 ? '#FF3B30' :
                             parsedSelectedDate.getDay() === 6 ? '#007AFF' : '#FF6B35'
                    }}
                  >
                    {WEEKDAYS_EN[parsedSelectedDate.getDay()]}
                  </p>
                  {/* 일 - 크게 */}
                  <p className="text-7xl font-bold text-gray-900 leading-none">
                    {parsedSelectedDate.getDate()}
                  </p>
                </>
              ) : (
                <div className="py-8">
                  <p className="text-gray-400 text-sm">날짜를 선택하세요</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 캘린더 */}
        <div className="flex-1 bg-white rounded-t-3xl shadow-lg overflow-hidden flex flex-col">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center">
              <span className="text-lg font-bold text-gray-900">
                {year}년 {month + 1}월
              </span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  index === 0 ? 'text-red-500' :
                  index === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1">
              {/* 빈 칸 (첫째 날 이전) */}
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* 날짜들 */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dayOfWeek = (firstDayOfMonth + index) % 7;
                const isSelected =
                  parsedSelectedDate?.getFullYear() === year &&
                  parsedSelectedDate?.getMonth() === month &&
                  parsedSelectedDate?.getDate() === day;
                const isToday =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === month &&
                  new Date().getDate() === day;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-gray-900 text-white shadow-lg scale-110'
                        : isToday
                        ? 'bg-gray-100 text-gray-900'
                        : dayOfWeek === 0
                        ? 'text-red-500 hover:bg-red-50'
                        : dayOfWeek === 6
                        ? 'text-blue-500 hover:bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 오늘 버튼 */}
          <div className="flex-none p-4 border-t border-gray-100">
            <button
              onClick={() => {
                const today = new Date();
                const dateStr = formatDateToISO(today);
                setViewDate(today);
                setSelectedDate(dateStr);
                onChange({ date: dateStr });
                onSelectComplete?.();
              }}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
            >
              오늘 날짜 선택
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DateBlockEditorInner.displayName = 'DateBlockEditorInner';

export const DateBlockEditor = DateBlockEditorInner;
