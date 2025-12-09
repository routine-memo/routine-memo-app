'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { Trash2 } from 'lucide-react';
import { BlockPosition, IconMap } from '../types';
import { blockPalette } from '../blockPalette';
import { calculateRows } from '../blockUtils';

// react-grid-layout CSS 필요
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GRID_COLS = 6;
const MARGIN: [number, number] = [8, 8];

// 모바일 최적화: gridWidth 기준으로 행 높이 동적 계산
const getRowHeight = (gridWidth: number): number => {
  // 모바일(375px 기준)에서 적절한 행 높이
  // 6열 기준으로 열당 최소 50px 정도 확보
  const colWidth = (gridWidth - MARGIN[0] * (GRID_COLS - 1)) / GRID_COLS;
  // 행 높이는 열 너비의 1.5배 정도로 설정 (최소 80, 최대 120)
  return Math.min(120, Math.max(80, Math.round(colWidth * 1.5)));
};

interface GridLayoutBlocksProps {
  blockPositions: BlockPosition[];
  iconMap: IconMap;
  gridWidth: number;
  onLayoutChange: (blocks: BlockPosition[]) => void;
  onRemove: (id: string) => void;
}

// BlockPosition을 react-grid-layout의 Layout으로 변환
const blockToLayout = (block: BlockPosition, rowHeight: number): Layout => {
  const rows = calculateRows(block.height || rowHeight);
  return {
    i: block.id,
    x: block.colStart,
    y: block.row,
    w: block.colSpan,
    h: rows,
    minW: 2,  // 최소 2열
    maxW: GRID_COLS,
    minH: 1,
    maxH: 4,
  };
};

// Layout을 BlockPosition으로 변환
const layoutToBlock = (
  layout: Layout,
  originalBlock: BlockPosition,
  rowHeight: number
): BlockPosition => {
  return {
    ...originalBlock,
    row: layout.y,
    colStart: layout.x,
    colSpan: layout.w,
    height: layout.h * rowHeight + (layout.h - 1) * MARGIN[1], // 행 수 * 높이 + gap
  };
};

export const GridLayoutBlocks = ({
  blockPositions,
  iconMap,
  gridWidth,
  onLayoutChange,
  onRemove,
}: GridLayoutBlocksProps) => {
  // 드래그/리사이즈 상태
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const draggingBlockId = useRef<string | null>(null);
  const lastMouseY = useRef<number>(0);
  const layoutBeforeDrag = useRef<BlockPosition[] | null>(null);  // 드래그 시작 전 레이아웃 저장

  // 동적 행 높이 계산
  const rowHeight = useMemo(() => getRowHeight(gridWidth), [gridWidth]);

  // BlockPosition 배열을 Layout 배열로 변환
  const layout = useMemo(() => {
    return blockPositions.map(block => blockToLayout(block, rowHeight));
  }, [blockPositions, rowHeight]);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    // 삭제 영역 위에 있을 때는 레이아웃 변경 완전 무시
    if (isOverTrash) {
      return;
    }

    const updatedBlocks = newLayout.map((layoutItem) => {
      const originalBlock = blockPositions.find(b => b.id === layoutItem.i);
      if (!originalBlock) return null;
      return layoutToBlock(layoutItem, originalBlock, rowHeight);
    }).filter((b): b is BlockPosition => b !== null);

    // 변경사항이 있을 때만 업데이트
    const hasChanges = updatedBlocks.some((updated) => {
      const original = blockPositions.find(b => b.id === updated.id);
      if (!original) return true;
      return (
        original.row !== updated.row ||
        original.colStart !== updated.colStart ||
        original.colSpan !== updated.colSpan ||
        original.height !== updated.height
      );
    });

    if (hasChanges) {
      onLayoutChange(updatedBlocks);
    }
  }, [blockPositions, onLayoutChange, rowHeight, isOverTrash]);

  // 전역 터치/마우스 이벤트로 위치 추적
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: TouchEvent | MouseEvent) => {
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (clientY === undefined) return;

      lastMouseY.current = clientY;

      const windowHeight = window.innerHeight;
      const trashZoneTop = windowHeight - 96;
      const isOver = clientY >= trashZoneTop;
      setIsOverTrash(isOver);
    };

    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mousemove', handleMove);

    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [isDragging]);

  // 드래그 시작
  const handleDragStart = useCallback((_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
    setIsDragging(true);
    draggingBlockId.current = newItem.i;
    // 드래그 시작 전 레이아웃 저장 (삭제 시 복원용)
    layoutBeforeDrag.current = [...blockPositions];
  }, [blockPositions]);

  // 드래그 종료
  const handleDragStop = useCallback(() => {
    const windowHeight = window.innerHeight;
    const trashZoneTop = windowHeight - 96;
    const shouldDelete = lastMouseY.current >= trashZoneTop && draggingBlockId.current;
    const deletingBlockId = draggingBlockId.current;

    if (shouldDelete && deletingBlockId && layoutBeforeDrag.current) {
      // 삭제 영역에 드롭된 경우:
      // 1. 먼저 원래 레이아웃으로 복원 (드래그로 인해 다른 블록들이 밀린 것 되돌리기)
      onLayoutChange(layoutBeforeDrag.current);
      // 2. 삭제 진행 (확인 다이얼로그 포함)
      onRemove(deletingBlockId);
    }

    setIsDragging(false);
    setIsOverTrash(false);
    draggingBlockId.current = null;
    lastMouseY.current = 0;
    layoutBeforeDrag.current = null;
  }, [onLayoutChange, onRemove]);

  // 리사이즈 시작
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  // 리사이즈 종료
  const handleResizeStop = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 블록이 없을 때는 빈 상태 표시 (gridWidth와 무관)
  if (blockPositions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            블록을 추가하여<br />템플릿을 만들어보세요
          </p>
        </div>
      </div>
    );
  }

  // 블록이 있는데 gridWidth가 아직 계산되지 않았으면 로딩 표시
  if (gridWidth <= 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  // 그리드 배경 스타일 계산
  const colWidth = (gridWidth - MARGIN[0] * (GRID_COLS - 1)) / GRID_COLS;
  const gridBackground = {
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${colWidth + MARGIN[0]}px ${rowHeight + MARGIN[1]}px`,
    backgroundPosition: `${-MARGIN[0] / 2}px ${-MARGIN[1] / 2}px`,
  };

  return (
    <div className={`grid-layout-container w-full ${isDragging ? 'is-dragging' : ''} ${isResizing ? 'is-resizing' : ''}`} style={gridBackground}>
      {/* 드래그 중인 블록 z-index 높이기 + 리사이즈 핸들 영역 확장 */}
      <style>{`
        .is-dragging .react-grid-item.react-draggable-dragging {
          z-index: 50 !important;
        }
        /* 리사이즈/드래그 중 pull-to-refresh 방지 */
        .grid-layout-container {
          touch-action: pan-x pan-y;
        }
        .grid-layout-container.is-dragging,
        .grid-layout-container.is-resizing {
          touch-action: none;
          overscroll-behavior: none;
        }
        /* 리사이즈 핸들 영역 확장 (모바일 터치 최적화) */
        .react-resizable-handle {
          position: absolute;
          touch-action: none;
          z-index: 10;
        }
        .react-resizable-handle-s {
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 32px;
          cursor: s-resize;
        }
        .react-resizable-handle-n {
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 32px;
          cursor: n-resize;
        }
        .react-resizable-handle-e {
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 80%;
          cursor: e-resize;
        }
        .react-resizable-handle-w {
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 80%;
          cursor: w-resize;
        }
        .react-resizable-handle-se {
          bottom: -8px;
          right: -8px;
          width: 40px;
          height: 40px;
          cursor: se-resize;
        }
        .react-resizable-handle-sw {
          bottom: -8px;
          left: -8px;
          width: 40px;
          height: 40px;
          cursor: sw-resize;
        }
        .react-resizable-handle-ne {
          top: -8px;
          right: -8px;
          width: 40px;
          height: 40px;
          cursor: ne-resize;
        }
        .react-resizable-handle-nw {
          top: -8px;
          left: -8px;
          width: 40px;
          height: 40px;
          cursor: nw-resize;
        }
      `}</style>
      <GridLayout
        className="layout"
        layout={layout}
        cols={GRID_COLS}
        rowHeight={rowHeight}
        width={gridWidth}
        margin={MARGIN}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
      >
        {blockPositions.map((block) => {
          const Icon = iconMap[blockPalette.find(p => p.type === block.type)?.icon || 'Type'];
          const label = blockPalette.find(p => p.type === block.type)?.label;

          return (
            <div
              key={block.id}
              className="bg-white border-2 border-gray-900 rounded-lg shadow-sm overflow-hidden cursor-move"
            >
              {/* 헤더 영역 */}
              <div className="absolute top-0 left-0 right-0 h-10 flex items-center px-3 bg-gray-900 rounded-t-[4px] pointer-events-none">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    {label}
                  </span>
                </div>
              </div>

              {/* 블록 콘텐츠 영역 */}
              <div className="pt-10 h-full">
                {/* 블록 타입별 콘텐츠 렌더링 가능 */}
              </div>
            </div>
          );
        })}
      </GridLayout>

      {/* 쓰레기통 영역 - 드래그 중일 때만 표시 */}
      {isDragging && (
        <div
          className={`
            fixed bottom-0 left-0 right-0 h-24 z-40
            flex items-center justify-center gap-2
            transition-colors duration-200
            ${isOverTrash ? 'bg-red-500' : 'bg-gray-800'}
          `}
        >
          <Trash2 className={`w-6 h-6 ${isOverTrash ? 'text-white' : 'text-gray-300'}`} />
          <span className={`font-medium ${isOverTrash ? 'text-white' : 'text-gray-300'}`}>
            {isOverTrash ? '놓으면 삭제됩니다' : '여기에 놓아서 삭제'}
          </span>
        </div>
      )}
    </div>
  );
};
