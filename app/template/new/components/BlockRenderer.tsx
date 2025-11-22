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
  onRemove,
  onResizeStart,
}: BlockRendererProps) => {
  const Icon = iconMap[paletteItems.find(p => p.type === block.type)?.icon || 'Type'];

  return (
    <div
      data-block-id={block.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`bg-white border-2 rounded-lg transition-all ${
        isDragging ? 'opacity-50 border-gray-300' : 'border-black'
      }`}
      style={{
        position: 'absolute',
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
      }}
    >
      {/* 드롭 인디케이터 */}
      {isDropTarget && dropTarget?.position === 'above' && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
      )}
      {isDropTarget && dropTarget?.position === 'below' && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
      )}
      {isDropTarget && dropTarget?.position === 'left' && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
      )}
      {isDropTarget && dropTarget?.position === 'right' && (
        <div className="absolute -right-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
      )}

      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {paletteItems.find(p => p.type === block.type)?.label}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200 rounded-r-lg"
        onMouseDown={(e) => onResizeStart(e, 'right')}
        onTouchStart={(e) => onResizeStart(e, 'right')}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-200 rounded-b-lg"
        onMouseDown={(e) => onResizeStart(e, 'bottom')}
        onTouchStart={(e) => onResizeStart(e, 'bottom')}
      />
    </div>
  );
};
