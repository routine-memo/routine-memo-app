'use client';

import { useMemo, useCallback } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { X } from 'lucide-react';
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
  // 동적 행 높이 계산
  const rowHeight = useMemo(() => getRowHeight(gridWidth), [gridWidth]);

  // BlockPosition 배열을 Layout 배열로 변환
  const layout = useMemo(() => {
    return blockPositions.map(block => blockToLayout(block, rowHeight));
  }, [blockPositions, rowHeight]);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
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
  }, [blockPositions, onLayoutChange, rowHeight]);

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

  return (
    <div className="grid-layout-container w-full overflow-hidden">
      <GridLayout
        className="layout"
        layout={layout}
        cols={GRID_COLS}
        rowHeight={rowHeight}
        width={gridWidth}
        margin={MARGIN}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        compactType={null}
        preventCollision={true}
        useCSSTransforms={true}
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
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
              <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3 bg-gray-50/50 pointer-events-none">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">
                    {label}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(block.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-red-600 transition-colors pointer-events-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 블록 콘텐츠 영역 */}
              <div className="pt-10 h-full">
                {/* 블록 타입별 콘텐츠 렌더링 가능 */}
              </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};
