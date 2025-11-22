import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { BlockPosition, DropTarget, IconMap } from '../types';
import { blockPalette } from '../blockPalette';
import { calculateRows } from '../blockUtils';

interface BlockRendererProps {
  block: BlockPosition;
  isDragging: boolean;
  isDropTarget: boolean;
  dropTarget: DropTarget | null;
  iconMap: IconMap;
  paletteItems: typeof blockPalette;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onRemove: () => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, direction: 'right' | 'bottom') => void;
}

export const BlockRenderer = ({
  block,
  isDragging,
  isDropTarget,
  dropTarget,
  iconMap,
  paletteItems,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchMove,
  onTouchEnd,
  onRemove,
  onResizeStart,
}: BlockRendererProps) => {
  const Icon = iconMap[paletteItems.find(p => p.type === block.type)?.icon || 'Type'];
  const blockRef = useRef<HTMLDivElement>(null);
  const mouseDownTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // 네이티브 터치 이벤트 리스너 등록 (passive: false로 preventDefault 가능하게)
  useEffect(() => {
    const element = blockRef.current;
    if (!element) return;

    const handleNativeTouchStart = (e: TouchEvent) => {
      // 즉시 preventDefault 호출 (스크롤 시작 전에 막기)
      e.preventDefault();
      e.stopPropagation();

      mouseDownTimeRef.current = Date.now();
      isDraggingRef.current = false;
      console.log('📱 터치 시작 - 타이머 시작');

      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // X 버튼 영역 체크 (상단 40px 내, 오른쪽 40px)
      const isDeleteButton = y < 40 && x > rect.width - 40;
      if (isDeleteButton) {
        console.log('🗑️ 삭제 버튼 터치');
        // X 버튼 클릭 처리
        onRemove();
        return;
      }

      // 리사이즈 영역 체크 (10px 확장)
      const isRightEdge = x > rect.width - 10;
      const isBottomEdge = y > rect.height - 10;

      if (isRightEdge || isBottomEdge) {
        console.log(`📏 리사이즈 영역 터치: ${isRightEdge ? '오른쪽' : '아래쪽'}`);
        // 리사이즈 처리
        const direction = isRightEdge ? 'right' : 'bottom';
        const reactEvent = {
          touches: [touch],
          preventDefault: () => {},
          stopPropagation: () => {},
        } as any;
        onResizeStart(reactEvent, direction);
        return;
      }

      // 일반 터치 - 200ms 후에 드래그 시작
      console.log('✋ 일반 블록 터치');
      setTimeout(() => {
        const timeDiff = Date.now() - mouseDownTimeRef.current;
        if (timeDiff >= 200) {
          console.log('✅ 드래그 판정! (200ms 경과)');
          isDraggingRef.current = true;
          onDragStart();
        }
      }, 200);
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 스크롤 방지

      if (onTouchMove) {
        const reactEvent = {
          touches: e.touches,
          currentTarget: element,
        } as any;
        onTouchMove(reactEvent);
      }
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      const timeDiff = Date.now() - mouseDownTimeRef.current;
      console.log(`🏁 터치 종료 - 경과 시간: ${timeDiff}ms, 드래그 중: ${isDraggingRef.current}`);

      // 빠른 탭 (< 200ms)이고 드래그 중이 아니면 블록 정보 표시
      if (timeDiff < 200 && !isDraggingRef.current) {
        console.log('✅ 클릭 판정! (200ms 미만 터치)');

        const touch = e.changedTouches[0];
        const rect = element.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // 리사이즈 영역이나 삭제 버튼 탭은 무시
        const isRightEdge = x > rect.width - 10;
        const isBottomEdge = y > rect.height - 10;
        const isDeleteButton = y < 40 && x > rect.width - 40;

        if (isRightEdge || isBottomEdge || isDeleteButton) {
          console.log('❌ 특수 영역 탭 (리사이즈/삭제 버튼)');
        } else {
          // 블록이 차지하는 행 수 계산
          const rowsOccupied = calculateRows(block.height);
          const endRow = block.row + rowsOccupied - 1;
          const endCol = block.colStart + block.colSpan - 1;

          console.log('📦 블록 정보:', {
            'RAW 블록 객체': block,
            '---계산된 정보---': '---',
            id: block.id,
            type: block.type,
            '현재 행 (row)': block.row,
            '시작 열 (colStart)': block.colStart,
            '열 크기 (colSpan)': block.colSpan,
            '마지막 열': endCol,
            '높이 (height px)': block.height,
            '차지하는 행 수': rowsOccupied,
            '마지막 행': endRow,
            '행 범위': `${block.row} ~ ${endRow}`,
            '열 범위': `${block.colStart} ~ ${endCol}`,
          });
        }
      }

      // 드래그 상태 리셋
      isDraggingRef.current = false;

      if (onTouchEnd) {
        const reactEvent = {
          touches: e.touches,
          currentTarget: element,
        } as any;
        onTouchEnd(reactEvent);
      }
    };

    // passive: false로 등록하여 preventDefault 가능하게
    element.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    element.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    element.addEventListener('touchend', handleNativeTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleNativeTouchStart);
      element.removeEventListener('touchmove', handleNativeTouchMove);
      element.removeEventListener('touchend', handleNativeTouchEnd);
    };
  }, [onDragStart, onTouchMove, onTouchEnd, onResizeStart, onRemove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTimeRef.current = Date.now();
    isDraggingRef.current = false;
    console.log('🖱️ 마우스 다운 - 타이머 시작');
  };

  const handleDragStart = (e: React.DragEvent) => {
    const timeDiff = Date.now() - mouseDownTimeRef.current;
    console.log(`⏱️ 드래그 시작 시도 - 경과 시간: ${timeDiff}ms`);

    // 200ms 이상 누르면 드래그 시작
    if (timeDiff >= 200) {
      isDraggingRef.current = true;
      console.log('✅ 드래그 판정! (200ms 이상)');
      onDragStart();
    } else {
      // 짧게 누르면 드래그 방지
      console.log('❌ 드래그 방지 (200ms 미만)');
      e.preventDefault();
      isDraggingRef.current = false;
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('🏁 드래그 종료');
    onDragEnd();
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const timeDiff = Date.now() - mouseDownTimeRef.current;
    console.log(`👆 클릭 이벤트 - 경과 시간: ${timeDiff}ms, 드래그 중: ${isDraggingRef.current}`);

    // 드래그 중이었으면 클릭 무시
    if (isDraggingRef.current) {
      console.log('❌ 드래그 중이므로 클릭 무시');
      return;
    }

    // 200ms 미만의 짧은 클릭만 처리
    if (timeDiff < 200) {
      console.log('✅ 클릭 판정! (200ms 미만)');

      // 리사이즈 영역이나 삭제 버튼 클릭은 무시
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isRightEdge = x > rect.width - 10;
      const isBottomEdge = y > rect.height - 10;
      const isDeleteButton = y < 40 && x > rect.width - 40;

      if (isRightEdge || isBottomEdge || isDeleteButton) {
        console.log('❌ 특수 영역 클릭 (리사이즈/삭제 버튼)');
        return;
      }

      // 블록이 차지하는 행 수 계산
      const rowsOccupied = calculateRows(block.height);
      const endRow = block.row + rowsOccupied - 1;
      const endCol = block.colStart + block.colSpan - 1;

      console.log('📦 블록 정보:', {
        'RAW 블록 객체': block,
        '---계산된 정보---': '---',
        id: block.id,
        type: block.type,
        '현재 행 (row)': block.row,
        '시작 열 (colStart)': block.colStart,
        '열 크기 (colSpan)': block.colSpan,
        '마지막 열': endCol,
        '높이 (height px)': block.height,
        '차지하는 행 수': rowsOccupied,
        '마지막 행': endRow,
        '행 범위': `${block.row} ~ ${endRow}`,
        '열 범위': `${block.colStart} ~ ${endCol}`,
      });
    } else {
      console.log('❌ 클릭 무시 (200ms 이상)');
    }
  };

  // 블록이 차지하는 행 수 계산
  const rowsOccupied = calculateRows(block.height || 120);

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      draggable
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleClick}
      className={`relative bg-white border-2 rounded-lg transition-all shadow-sm cursor-move ${
        isDragging ? 'opacity-50 border-gray-300' : 'border-gray-900'
      }`}
      style={{
        gridColumn: `${block.colStart + 1} / span ${block.colSpan}`,
        gridRow: `1 / span ${rowsOccupied}`, // 여러 행을 차지
        height: `${block.height}px`,
        touchAction: 'none', // 터치 제스처 비활성화
      }}
    >
      {/* 드롭 인디케이터 */}
      {isDropTarget && dropTarget?.position === 'above' && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-gray-900 rounded-full z-30 pointer-events-none" />
      )}
      {isDropTarget && dropTarget?.position === 'below' && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gray-900 rounded-full z-30 pointer-events-none" />
      )}
      {isDropTarget && dropTarget?.position === 'left' && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gray-900 rounded-full z-30 pointer-events-none" />
      )}
      {isDropTarget && dropTarget?.position === 'right' && (
        <div className="absolute -right-2 top-0 bottom-0 w-1 bg-gray-900 rounded-full z-30 pointer-events-none" />
      )}

      {/* 블록 헤더 */}
      <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3 pointer-events-none">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-900">
            {paletteItems.find(p => p.type === block.type)?.label}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
          className="text-gray-400 hover:text-red-600 transition-colors pointer-events-auto"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 리사이즈 핸들 - 우측 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[10px] cursor-ew-resize hover:bg-gray-400/30 transition-colors z-20"
        draggable={false}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, 'right');
        }}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      {/* 리사이즈 핸들 - 하단 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[10px] cursor-ns-resize hover:bg-gray-400/30 transition-colors z-20"
        draggable={false}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, 'bottom');
        }}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      {/* 리사이즈 핸들 - 우측 하단 모서리 */}
      <div
        className="absolute right-0 bottom-0 w-[10px] h-[10px] cursor-nwse-resize hover:bg-gray-400/50 transition-colors z-30"
        draggable={false}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, 'right');
        }}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
};
