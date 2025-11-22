import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { BlockPosition, DropTarget, IconMap } from '../types';
import { blockPalette } from '../blockPalette';

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

  // 네이티브 터치 이벤트 리스너 등록 (passive: false로 preventDefault 가능하게)
  useEffect(() => {
    const element = blockRef.current;
    if (!element) return;

    const handleNativeTouchStart = (e: TouchEvent) => {
      // 즉시 preventDefault 호출 (스크롤 시작 전에 막기)
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // X 버튼 영역 체크 (상단 40px 내, 오른쪽 40px)
      const isDeleteButton = y < 40 && x > rect.width - 40;
      if (isDeleteButton) {
        // X 버튼 클릭 처리
        onRemove();
        return;
      }

      // 리사이즈 영역 체크 (10px 확장)
      const isRightEdge = x > rect.width - 10;
      const isBottomEdge = y > rect.height - 10;

      if (isRightEdge || isBottomEdge) {
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

      onDragStart();
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

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd();
  };

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative bg-white border-2 rounded-lg transition-all shadow-sm cursor-move ${
        isDragging ? 'opacity-50 border-gray-300' : 'border-gray-900'
      }`}
      style={{
        gridColumn: `${block.colStart + 1} / span ${block.colSpan}`,
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
