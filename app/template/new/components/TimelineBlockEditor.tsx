'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { X, Trash2, Clock, ChevronDown } from 'lucide-react';
import { TimelineBlockDefault, TimelineItem, TimelineRowSpan } from '../types';

interface TimelineBlockEditorProps {
  initialValue?: TimelineBlockDefault;
  onChange: (value: TimelineBlockDefault) => void;
}

export interface TimelineBlockEditorHandle {
  save: () => Promise<void>;
}

// 일정 색상 팔레트
const COLORS = [
  '#3B82F6', // 파랑
  '#8B5CF6', // 보라
  '#EC4899', // 핑크
  '#EF4444', // 빨강
  '#F97316', // 주황
  '#EAB308', // 노랑
  '#22C55E', // 초록
  '#14B8A6', // 청록
];

// 고유 ID 생성
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 시간 범위: 06:00 ~ 24:00 (18시간)
const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const ROW_HEIGHT = 44;
const COL_WIDTH = 45;
const TOTAL_COLS = 5; // :00, :15, :30, :45, :60

// 셀이 아이템에 포함되는지 확인
const isCellInItem = (item: TimelineItem, hour: number, col: number): boolean => {
  const row = item.rows.find(r => r.hour === hour);
  if (!row) return false;
  return col >= row.startCol && col < row.endCol;
};

// 아이템의 시간 범위 텍스트
const getItemTimeRange = (item: TimelineItem): string => {
  if (item.rows.length === 0) return '';
  const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
  const first = sortedRows[0];
  const last = sortedRows[sortedRows.length - 1];
  const startMin = first.startCol * 15;
  const endMin = last.endCol * 15;
  const startTime = `${first.hour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
  const endHour = last.hour + (last.endCol === TOTAL_COLS ? 1 : 0);
  const endMinute = last.endCol === TOTAL_COLS ? 0 : endMin;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  return `${startTime}-${endTime}`;
};

// 시간 옵션 생성 (6:00 ~ 24:00, 15분 단위)
const generateTimeOptions = (): { hour: number; minute: number; label: string }[] => {
  const options: { hour: number; minute: number; label: string }[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const minutes = h === END_HOUR ? [0] : [0, 15, 30, 45];
    for (const m of minutes) {
      options.push({
        hour: h,
        minute: m,
        label: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const TimelineBlockEditorInner = forwardRef<TimelineBlockEditorHandle, TimelineBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const [items, setItems] = useState<TimelineItem[]>(initialValue?.items || []);
    const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [tempStartTime, setTempStartTime] = useState<{ hour: number; minute: number } | null>(null);
    const [tempEndTime, setTempEndTime] = useState<{ hour: number; minute: number } | null>(null);
    const [dragState, setDragState] = useState<{
      startHour: number;
      startCol: number;
      currentHour: number;
      currentCol: number;
    } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 아이템이 변경될 때 부모에게 알림
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onChangeRef.current({ items });
    }, [items]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ items });
    }, [items, onChange]);

    useImperativeHandle(ref, () => ({ save }), [save]);

    // 마우스/터치 위치를 셀로 변환
    const positionToCell = useCallback((clientX: number, clientY: number): { hour: number; col: number } | null => {
      if (!containerRef.current) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      const x = clientX - rect.left + scrollLeft;
      const y = clientY - rect.top + scrollTop - 32; // 헤더 높이

      const col = Math.floor(x / COL_WIDTH);
      const rowIndex = Math.floor(y / ROW_HEIGHT);

      if (col < 0 || col >= TOTAL_COLS || rowIndex < 0 || rowIndex >= TOTAL_HOURS) {
        return null;
      }

      return { hour: START_HOUR + rowIndex, col };
    }, []);

    // 해당 셀에 있는 아이템 찾기
    const findItemAtCell = useCallback((hour: number, col: number): TimelineItem | null => {
      return items.find(item => isCellInItem(item, hour, col)) || null;
    }, [items]);

    // 충돌 처리: 새 아이템이 기존 아이템과 겹치면 기존 아이템 조정
    const resolveCollisions = useCallback((newItem: TimelineItem, existingItems: TimelineItem[]): TimelineItem[] => {
      const result: TimelineItem[] = [];

      for (const item of existingItems) {
        if (item.id === newItem.id) continue;

        const adjustedRows: TimelineRowSpan[] = [];

        for (const row of item.rows) {
          const newRow = newItem.rows.find(r => r.hour === row.hour);

          if (!newRow) {
            adjustedRows.push(row);
            continue;
          }

          // 새 아이템이 전체를 덮으면 이 행 삭제
          if (newRow.startCol <= row.startCol && newRow.endCol >= row.endCol) {
            continue;
          }

          // 새 아이템이 왼쪽을 침범
          if (newRow.startCol <= row.startCol && newRow.endCol > row.startCol && newRow.endCol < row.endCol) {
            adjustedRows.push({ ...row, startCol: newRow.endCol });
            continue;
          }

          // 새 아이템이 오른쪽을 침범
          if (newRow.startCol > row.startCol && newRow.startCol < row.endCol && newRow.endCol >= row.endCol) {
            adjustedRows.push({ ...row, endCol: newRow.startCol });
            continue;
          }

          // 새 아이템이 중간에 있음 (왼쪽 부분만 남김)
          if (newRow.startCol > row.startCol && newRow.endCol < row.endCol) {
            adjustedRows.push({ ...row, endCol: newRow.startCol });
            continue;
          }

          // 겹치지 않음
          if (newRow.endCol <= row.startCol || newRow.startCol >= row.endCol) {
            adjustedRows.push(row);
          }
        }

        if (adjustedRows.length > 0) {
          result.push({ ...item, rows: adjustedRows });
        }
      }

      return result;
    }, []);

    // 드래그 시작 (빈 셀에서만)
    const handleCellDragStart = useCallback((hour: number, col: number, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();

      // 이미 아이템이 있는 셀이면 클릭으로 편집
      const existingItem = findItemAtCell(hour, col);
      if (existingItem) {
        setEditingItem({ ...existingItem });
        return;
      }

      // 새 블록 생성 드래그 시작
      setDragState({
        startHour: hour,
        startCol: col,
        currentHour: hour,
        currentCol: col + 1,
      });
    }, [findItemAtCell]);

    // 드래그 중 & 종료 처리
    useEffect(() => {
      if (!dragState) return;

      // 드래그 중 스크롤 방지
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const handleMove = (clientX: number, clientY: number) => {
        const cell = positionToCell(clientX, clientY);
        if (!cell) return;

        setDragState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentHour: cell.hour,
            currentCol: cell.col + 1,
          };
        });
      };

      const handleEnd = () => {
        if (!dragState) return;

        // 새 블록 생성
        let startHour = dragState.startHour;
        let startCol = dragState.startCol;
        let endHour = dragState.currentHour;
        let endCol = dragState.currentCol;

        // 역방향 드래그 처리
        if (endHour < startHour || (endHour === startHour && endCol < startCol)) {
          [startHour, endHour] = [endHour, startHour];
          [startCol, endCol] = [endCol - 1, startCol + 1];
        }

        // 행 범위 생성
        const rows: TimelineRowSpan[] = [];
        for (let h = startHour; h <= endHour; h++) {
          const rowStartCol = h === startHour ? startCol : 0;
          const rowEndCol = h === endHour ? Math.min(endCol, TOTAL_COLS) : TOTAL_COLS;
          if (rowEndCol > rowStartCol) {
            rows.push({ hour: h, startCol: rowStartCol, endCol: rowEndCol });
          }
        }

        if (rows.length > 0) {
          const newItem: TimelineItem = {
            id: generateId(),
            title: '',
            rows,
            color: COLORS[items.length % COLORS.length],
          };

          const resolvedItems = resolveCollisions(newItem, items);
          setItems([...resolvedItems, newItem]);
          setEditingItem(newItem);
        }

        setDragState(null);
      };

      const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }, [dragState, items, positionToCell, resolveCollisions]);

    // 블록 삭제
    const handleDeleteItem = useCallback((id: string) => {
      setItems(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      setIsEditingTime(false);
    }, []);

    // 편집 저장
    const handleSaveEdit = useCallback(() => {
      if (!editingItem) return;

      // 충돌 처리 후 저장
      const otherItems = items.filter(i => i.id !== editingItem.id);
      const resolvedItems = resolveCollisions(editingItem, otherItems);
      setItems([...resolvedItems, editingItem]);
      setEditingItem(null);
      setIsEditingTime(false);
    }, [editingItem, items, resolveCollisions]);

    // 드래그 미리보기 계산
    const getDragPreviewCells = useCallback((): { hour: number; col: number }[] => {
      if (!dragState) return [];

      let startHour = dragState.startHour;
      let startCol = dragState.startCol;
      let endHour = dragState.currentHour;
      let endCol = dragState.currentCol;

      if (endHour < startHour || (endHour === startHour && endCol < startCol)) {
        [startHour, endHour] = [endHour, startHour];
        [startCol, endCol] = [endCol - 1, startCol + 1];
      }

      const cells: { hour: number; col: number }[] = [];
      for (let h = startHour; h <= endHour; h++) {
        const rowStartCol = h === startHour ? startCol : 0;
        const rowEndCol = h === endHour ? Math.min(endCol, TOTAL_COLS) : TOTAL_COLS;
        for (let c = rowStartCol; c < rowEndCol; c++) {
          cells.push({ hour: h, col: c });
        }
      }
      return cells;
    }, [dragState]);

    const previewCells = getDragPreviewCells();

    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* 안내 문구 */}
        <div className="flex-none px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-600 text-center">
            스케줄을 추가할 칸을 드래그해 일정을 추가하세요
          </p>
        </div>

        {/* 타임라인 그리드 */}
        <div className="flex-1 overflow-auto">
          <div className="inline-flex min-w-full">
            {/* 시간 레이블 열 */}
            <div className="flex-none w-14 bg-white border-r border-gray-300 sticky left-0 z-20">
              <div className="h-8 border-b border-gray-300" />
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="flex items-center justify-end pr-2 text-xs text-gray-700 font-semibold border-b border-gray-200"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                );
              })}
            </div>

            {/* 그리드 영역 */}
            <div ref={containerRef} className="flex-1 bg-white relative">
              {/* 분 헤더 */}
              <div className="flex h-8 border-b border-gray-300 sticky top-0 bg-white z-10">
                {[0, 15, 30, 45, 60].map((minute) => (
                  <div
                    key={minute}
                    className="flex items-center justify-center text-xs text-gray-600 font-semibold border-r border-gray-200"
                    style={{ width: COL_WIDTH }}
                  >
                    :{minute.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* 시간 행들 */}
              <div className="relative">
                {Array.from({ length: TOTAL_HOURS }).map((_, hourIdx) => {
                  const hour = START_HOUR + hourIdx;
                  return (
                    <div
                      key={hour}
                      className="flex border-b border-gray-200 relative"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {/* 셀 배경 (border) */}
                      {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                        const isPreview = previewCells.some(c => c.hour === hour && c.col === col);

                        return (
                          <div
                            key={col}
                            className={`border-r border-gray-200 relative ${
                              isPreview ? 'bg-blue-100' : 'hover:bg-gray-50'
                            } cursor-crosshair`}
                            style={{ width: COL_WIDTH, height: ROW_HEIGHT }}
                            onMouseDown={(e) => handleCellDragStart(hour, col, e)}
                            onTouchStart={(e) => handleCellDragStart(hour, col, e)}
                          />
                        );
                      })}
                    </div>
                  );
                })}

                {/* 아이템 렌더링 - 그리드 전체 위에 별도 레이어로 */}
                {items.map((item) => {
                  if (item.rows.length === 0) return null;

                  const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
                  const firstRow = sortedRows[0];
                  const lastRow = sortedRows[sortedRows.length - 1];

                  // 각 행별로 블록 렌더링
                  return sortedRows.map((rowData, idx) => {
                    const colSpan = rowData.endCol - rowData.startCol;
                    const isFirstRow = idx === 0;
                    const isLastRow = idx === sortedRows.length - 1;
                    const hasPrevRow = idx > 0;
                    const hasNextRow = idx < sortedRows.length - 1;

                    return (
                      <div
                        key={`${item.id}-${rowData.hour}`}
                        className="absolute flex items-center overflow-hidden pointer-events-none"
                        style={{
                          backgroundColor: item.color,
                          left: rowData.startCol * COL_WIDTH + 2,
                          width: colSpan * COL_WIDTH - 4,
                          top: (rowData.hour - START_HOUR) * ROW_HEIGHT + (hasPrevRow ? 0 : 2),
                          height: ROW_HEIGHT - (hasPrevRow ? 0 : 2) - (hasNextRow ? 0 : 2),
                          borderTopLeftRadius: !hasPrevRow ? '0.375rem' : 0,
                          borderTopRightRadius: !hasPrevRow ? '0.375rem' : 0,
                          borderBottomLeftRadius: !hasNextRow ? '0.375rem' : 0,
                          borderBottomRightRadius: !hasNextRow ? '0.375rem' : 0,
                        }}
                      >
                        {/* 첫 번째 행에만 제목 표시 */}
                        {isFirstRow && (
                          <span className="text-white text-[10px] font-medium px-1.5 truncate">
                            {item.title || '(제목 없음)'}
                          </span>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 편집 모달 */}
        {editingItem && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
            <div
              className="w-full max-w-lg bg-white rounded-t-3xl p-6 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">일정 편집</h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsEditingTime(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 제목 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  일정 제목
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="일정 이름을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* 시간 편집 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시간
                </label>
                {!isEditingTime ? (
                  <button
                    onClick={() => {
                      // 현재 시간 범위를 임시 상태에 저장
                      if (editingItem.rows.length > 0) {
                        const sortedRows = [...editingItem.rows].sort((a, b) => a.hour - b.hour);
                        const first = sortedRows[0];
                        const last = sortedRows[sortedRows.length - 1];
                        setTempStartTime({ hour: first.hour, minute: first.startCol * 15 });
                        const endMinute = last.endCol * 15;
                        setTempEndTime({
                          hour: last.endCol === TOTAL_COLS ? last.hour + 1 : last.hour,
                          minute: last.endCol === TOTAL_COLS ? 0 : endMinute
                        });
                      }
                      setIsEditingTime(true);
                    }}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {getItemTimeRange(editingItem)}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl space-y-3">
                    {/* 시작 시간 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">시작</span>
                      <select
                        value={`${tempStartTime?.hour}-${tempStartTime?.minute}`}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split('-').map(Number);
                          setTempStartTime({ hour: h, minute: m });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TIME_OPTIONS.slice(0, -1).map((opt) => (
                          <option key={`start-${opt.hour}-${opt.minute}`} value={`${opt.hour}-${opt.minute}`}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* 종료 시간 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">종료</span>
                      <select
                        value={`${tempEndTime?.hour}-${tempEndTime?.minute}`}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split('-').map(Number);
                          setTempEndTime({ hour: h, minute: m });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TIME_OPTIONS.filter(opt => {
                          if (!tempStartTime) return true;
                          const startMinutes = tempStartTime.hour * 60 + tempStartTime.minute;
                          const optMinutes = opt.hour * 60 + opt.minute;
                          return optMinutes > startMinutes;
                        }).map((opt) => (
                          <option key={`end-${opt.hour}-${opt.minute}`} value={`${opt.hour}-${opt.minute}`}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* 적용/취소 버튼 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setIsEditingTime(false)}
                        className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (!tempStartTime || !tempEndTime) return;

                          // 새로운 rows 생성
                          const newRows: TimelineRowSpan[] = [];

                          // 종료 시간이 다음 시간의 :00이면 이전 시간의 :60까지
                          const effectiveEndHour = tempEndTime.minute === 0 && tempEndTime.hour > tempStartTime.hour
                            ? tempEndTime.hour - 1
                            : tempEndTime.hour;
                          const effectiveEndMinute = tempEndTime.minute === 0 && tempEndTime.hour > tempStartTime.hour
                            ? 60
                            : tempEndTime.minute;

                          for (let h = tempStartTime.hour; h <= effectiveEndHour; h++) {
                            if (h < START_HOUR || h >= END_HOUR) continue;

                            const hourStartMinute = h === tempStartTime.hour ? tempStartTime.minute : 0;
                            const hourEndMinute = h === effectiveEndHour ? effectiveEndMinute : 60;

                            if (hourEndMinute <= hourStartMinute) continue;

                            const startCol = Math.floor(hourStartMinute / 15);
                            // 60분일 때는 endCol이 5가 되어야 함 (5열 시스템: 0,1,2,3,4 -> endCol은 1~5)
                            const endCol = hourEndMinute === 60 ? 5 : Math.ceil(hourEndMinute / 15);

                            if (endCol > startCol && startCol < TOTAL_COLS) {
                              newRows.push({
                                hour: h,
                                startCol: Math.min(startCol, TOTAL_COLS - 1),
                                endCol: Math.min(endCol, TOTAL_COLS),
                              });
                            }
                          }

                          if (newRows.length > 0) {
                            setEditingItem({ ...editingItem, rows: newRows });
                          }
                          setIsEditingTime(false);
                        }}
                        className="flex-1 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                      >
                        적용
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 색상 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  색상
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingItem({ ...editingItem, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        editingItem.color === color
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteItem(editingItem.id)}
                  className="flex-none px-4 py-3 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TimelineBlockEditorInner.displayName = 'TimelineBlockEditorInner';

export const TimelineBlockEditor = TimelineBlockEditorInner;
