'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Entry } from '@/lib/storage/entry';
import { BlockPosition, BlockDefaultValue } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { calculateRows } from '@/app/template/new/blockUtils';
import { getWeatherInfo } from '@/app/template/new/components/WeatherBlockEditor';
import { getEmotionInfo } from '@/app/template/new/components/EmotionBlockEditor';
import { LinkBlockPreview } from '@/app/template/new/components/LinkBlockPreview';
import { FileBlockPreview } from '@/app/template/new/components/FileBlockPreview';
import { DateBlockPreview } from '@/app/template/new/components/DateBlockPreview';
import { TimelineBlockPreview } from '@/app/template/new/components/TimelineBlockPreview';
import { DataGraphBlockPreview } from '@/app/template/new/components/DataGraphBlockPreview';
import { MapBlockPreview } from '@/app/template/new/components/MapBlockPreview';
import { ProgressBlockPreview } from '@/app/template/new/components/ProgressBlockPreview';
import { SwipeablePreview } from '@/app/template/new/components/SwipeablePreview';

const GRID_COLS = 6;
const MARGIN = 8;

// gridWidth 기준으로 행 높이 동적 계산
const getRowHeight = (gridWidth: number): number => {
  const colWidth = (gridWidth - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
  return Math.min(120, Math.max(80, Math.round(colWidth * 1.5)));
};

interface EntryCarouselProps {
  entries: Entry[];
  blocks: BlockPosition[];
  selectedBlockIds: string[];
  albumId: string;
  onEntryDelete?: (entryId: string) => void;
  isFullscreenMode?: boolean;
  onToggleFullscreen?: () => void;
}

// 선택된 블록에 값이 있는 엔트리만 필터링
function filterEntriesWithValues(
  entries: Entry[],
  selectedBlockIds: string[]
): Entry[] {
  if (selectedBlockIds.length === 0) {
    return entries;
  }

  return entries.filter(entry => {
    return selectedBlockIds.some(blockId => {
      const blockValue = entry.blockValues.find(bv => bv.blockId === blockId);
      if (!blockValue) return false;
      return hasValue(blockValue.value);
    });
  });
}

// 블록 값이 유효한지 확인
function hasValue(value: BlockDefaultValue): boolean {
  switch (value.type) {
    case 'text':
      return !!(value.value.richText && value.value.richText !== '<p></p>');
    case 'image':
      return !!(value.value.images && value.value.images.length > 0);
    case 'video':
      return !!(value.value.videos && value.value.videos.length > 0);
    case 'link':
      return !!(value.value.links && value.value.links.length > 0);
    case 'file':
      return !!(value.value.files && value.value.files.length > 0);
    case 'weather':
      return !!value.value.weather;
    case 'emotion':
      return !!value.value.emotion;
    case 'date':
      return !!value.value.date;
    case 'checklist':
      return !!(value.value.html && value.value.html.includes('<li'));
    case 'timeline':
      return !!(value.value.items && value.value.items.length > 0);
    case 'dataGraph':
      return !!(value.value.values && value.value.values.length > 0);
    case 'map':
      return !!(value.value.markers && value.value.markers.length > 0);
    case 'progress':
      if (value.value.mode === 'dday') {
        return !!value.value.targetDate;
      }
      return value.value.currentValue !== undefined;
    default:
      return false;
  }
}

export function EntryCarousel({
  entries,
  blocks,
  selectedBlockIds,
  albumId,
  onEntryDelete,
  isFullscreenMode = false,
  onToggleFullscreen,
}: EntryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // 0 = 캐러셀, 1 = 전체화면, 중간값 = 전환 중
  const [viewProgress, setViewProgress] = useState(isFullscreenMode ? 1 : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 필터링된 엔트리 (역순: 오래된 기록이 먼저, 최신이 마지막)
  const filteredEntries = useMemo(
    () => filterEntriesWithValues(entries, selectedBlockIds).slice().reverse(),
    [entries, selectedBlockIds]
  );

  const itemCount = filteredEntries.length;

  // 처음 로드 시 최신 기록(마지막 인덱스)으로 스크롤
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && itemCount > 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // 마지막 아이템(최신)으로 스크롤
      setTimeout(() => {
        container.scrollLeft = container.scrollWidth;
        setCurrentIndex(itemCount - 1);
        setInitialized(true);
      }, 100);
    }
  }, [initialized, itemCount]);

  // 부드러운 애니메이션으로 viewProgress 전환
  const animateToProgress = useCallback((target: number, duration: number = 400) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsAnimating(true);
    const startProgress = viewProgress;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const newProgress = startProgress + (target - startProgress) * eased;

      setViewProgress(newProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setViewProgress(target);
        setIsAnimating(false);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [viewProgress]);

  // 스크롤 이벤트 핸들러 (가로 스크롤)
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    // 전체화면 모드일 때 스크롤하면 캐러셀로 돌아가기
    if (viewProgress > 0) {
      animateToProgress(0, 300);
    }

    // 현재 인덱스 계산 (가로 스크롤)
    const container = scrollContainerRef.current;
    const cardWidth = container.clientWidth * 0.75;
    const gap = 16;
    const scrollPos = container.scrollLeft;
    const newIndex = Math.round(scrollPos / (cardWidth + gap));
    setCurrentIndex(Math.max(0, Math.min(newIndex, itemCount - 1)));
  }, [viewProgress, itemCount, animateToProgress]);

  // 클린업
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 특정 인덱스로 스크롤 (가로)
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.clientWidth * 0.75;
    const gap = 16;
    container.scrollTo({
      left: index * (cardWidth + gap),
      behavior: 'smooth'
    });
  }, []);

  // 전체화면 나가기 애니메이션 함수
  const exitFullscreen = useCallback(() => {
    animateToProgress(0, 300);
  }, [animateToProgress]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < itemCount - 1) {
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'Escape' && viewProgress > 0.5) {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, itemCount, viewProgress, exitFullscreen, scrollToIndex]);

  // 전체화면 상태 여부 (progress가 0.5 이상이면 전체화면 UI 표시)
  const isFullscreen = viewProgress > 0.5;

  if (itemCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {selectedBlockIds.length > 0
              ? '선택된 블록에 해당하는 기록이 없습니다'
              : '아직 기록이 없어요'}
          </p>
        </div>
      </div>
    );
  }

  const currentEntry = filteredEntries[currentIndex];
  const recordNumber = currentIndex + 1;

  // 터치 핸들러 - 좌우 스와이프 감지 (전체화면 모드에서)
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isFullscreen) return;

    const diff = touchStartX.current - touchCurrentX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      // 좌우 스와이프 감지 시 캐러셀로 전환하고 다음/이전으로 이동
      exitFullscreen();
      if (diff > 0 && currentIndex < itemCount - 1) {
        // 왼쪽으로 스와이프 -> 다음 기록
        setTimeout(() => scrollToIndex(currentIndex + 1), 400);
      } else if (diff < 0 && currentIndex > 0) {
        // 오른쪽으로 스와이프 -> 이전 기록
        setTimeout(() => scrollToIndex(currentIndex - 1), 400);
      }
    }

    touchStartX.current = 0;
    touchCurrentX.current = 0;
  }, [currentIndex, itemCount, scrollToIndex, exitFullscreen, isFullscreen]);

  // 날짜 포맷 함수
  const formatEntryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // viewProgress에 따른 스타일 보간
  // 배경색: gray-100 (캐러셀) -> white (전체화면)
  const bgColor = `rgb(${Math.round(243 + (255 - 243) * viewProgress)}, ${Math.round(244 + (255 - 244) * viewProgress)}, ${Math.round(246 + (255 - 246) * viewProgress)})`;

  // 카드 높이: 85% (캐러셀) -> 100% (전체화면)
  const cardHeightPercent = 85 + 15 * viewProgress;

  // 카드 둥글기: 16px (캐러셀) -> 0px (전체화면)
  const borderRadius = 16 * (1 - viewProgress);

  // 그림자: 있음 (캐러셀) -> 없음 (전체화면)
  const shadowOpacity = 1 - viewProgress;

  // 헤더/인디케이터 투명도: 1 (캐러셀) -> 0 (전체화면)
  const carouselUIOpacity = 1 - viewProgress;

  // 전체화면 헤더 투명도: 0 (캐러셀) -> 1 (전체화면)
  const fullscreenUIOpacity = viewProgress;

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 캐러셀 헤더 (기록 번호 뱃지) + 인디케이터 */}
      <div
        className="flex-none overflow-hidden"
        style={{
          height: viewProgress > 0.5 ? 0 : 'auto',
          opacity: carouselUIOpacity,
          transform: `translateY(${-16 * viewProgress}px)`,
          pointerEvents: viewProgress > 0.5 ? 'none' : 'auto',
        }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-center">
          <span className="px-3 py-1 bg-gray-900 text-white text-sm font-medium rounded-full">
            {recordNumber}번째 기록
          </span>
        </div>
        {/* 좌우 스크롤 인디케이터 */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {filteredEntries.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${index === currentIndex ? 'bg-gray-900 w-4' : 'bg-gray-300 w-1.5'}
              `}
            />
          ))}
        </div>
      </div>

      {/* 전체화면 헤더 (오버레이) */}
      <div
        className="absolute top-0 left-0 right-0 z-20"
        style={{
          opacity: fullscreenUIOpacity,
          transform: `translateY(${-16 * (1 - viewProgress)}px)`,
          pointerEvents: viewProgress > 0.5 ? 'auto' : 'none',
        }}
      >
        {/* 헤더 내용 */}
        <div className="px-4 py-2 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {recordNumber}번째 기록
              </p>
              {currentEntry && (
                <p className="text-xs text-gray-500">
                  {formatEntryDate(currentEntry.createdAt)}
                </p>
              )}
            </div>
            {onEntryDelete && currentEntry && (
              <button
                onClick={() => {
                  if (confirm('이 기록을 삭제하시겠습니까?')) {
                    onEntryDelete(currentEntry.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        {/* 전체화면 인디케이터 - 스크롤해도 고정 */}
        <div className="flex flex-col items-center bg-white border-b border-gray-200">
          <div className="flex items-center justify-center gap-1.5 py-1">
            {filteredEntries.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  exitFullscreen();
                  setTimeout(() => scrollToIndex(index), 300);
                }}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${index === currentIndex ? 'bg-gray-900 w-4' : 'bg-gray-300 w-1.5'}
                `}
              />
            ))}
          </div>
          {itemCount > 1 && (
            <p className="text-xs text-gray-400 pb-1">좌우로 스크롤해 다른 기록 보기</p>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 영역 - 가로 스크롤 */}
      <div className="flex-1 relative">
        {/* 클릭하여 확인 안내 - 카드 상단 테두리에 걸침 */}
        {itemCount > 1 && viewProgress < 0.5 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            style={{
              top: 'calc((100% - 85%) / 2 - 12px)',
              opacity: carouselUIOpacity,
            }}
          >
            <span className="px-3 py-1 bg-gray-900/80 text-white text-xs font-medium rounded-lg shadow-lg">
              클릭하여 확인
            </span>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          onScroll={viewProgress < 0.1 && !isAnimating ? handleScroll : undefined}
          className="h-full flex items-center snap-x snap-mandatory scroll-smooth"
          style={{
            overflowX: viewProgress > 0.5 ? 'hidden' : 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            gap: '16px',
          }}
        >
        {/* 왼쪽 스페이서 - 첫 카드를 가운데로 */}
        <div
          className="flex-none"
          style={{ width: 'calc((100% - 75%) / 2 - 8px)' }}
        />
        {filteredEntries.map((entry, index) => {
          const isActive = index === currentIndex;

          // 비활성 카드의 투명도 및 스케일
          const inactiveOpacity = isActive ? 1 : Math.max(0, 0.7 - viewProgress * 0.7);
          const inactiveScale = isActive ? 1 : Math.max(0.8, 0.95 - viewProgress * 0.15);

          return (
            <div
              key={entry.id}
              onClick={() => {
                if (viewProgress < 0.5) {
                  if (isActive) {
                    // 활성 카드 클릭 시 전체화면 전환
                    animateToProgress(1, 500);
                  } else {
                    scrollToIndex(index);
                  }
                }
              }}
              className="flex-none snap-center bg-white overflow-hidden"
              style={{
                width: isActive ? `${75 + 25 * viewProgress}%` : '75%',
                maxWidth: isActive ? `${360 + 640 * viewProgress}px` : '360px',
                height: isActive ? `${cardHeightPercent}%` : '85%',
                maxHeight: isActive ? `${600 + 400 * viewProgress}px` : '600px',
                borderRadius: isActive ? borderRadius : 16,
                boxShadow: isActive
                  ? `0 ${10 * shadowOpacity}px ${15 * shadowOpacity}px -3px rgba(0, 0, 0, ${0.1 * shadowOpacity}), 0 ${4 * shadowOpacity}px ${6 * shadowOpacity}px -4px rgba(0, 0, 0, ${0.1 * shadowOpacity})`
                  : `0 10px 15px -3px rgba(0, 0, 0, ${0.1 * inactiveOpacity}), 0 4px 6px -4px rgba(0, 0, 0, ${0.1 * inactiveOpacity})`,
                opacity: isActive ? 1 : inactiveOpacity,
                transform: `scale(${isActive ? 1 : inactiveScale})`,
                cursor: viewProgress < 0.5 ? 'pointer' : 'default',
                transition: isAnimating ? 'none' : 'opacity 0.3s ease, transform 0.3s ease',
              }}
            >
              <div
                className="h-full"
                style={{
                  overflowY: viewProgress > 0.8 ? 'auto' : 'hidden',
                  paddingTop: isActive && viewProgress > 0.5 ? 90 : 0,
                }}
              >
                <EntryGridView
                  entry={entry}
                  blocks={blocks}
                  selectedBlockIds={selectedBlockIds}
                  albumId={albumId}
                  hideHeader={viewProgress > 0.5}
                />
              </div>
            </div>
          );
        })}
        {/* 오른쪽 스페이서 - 마지막 카드를 가운데로 */}
        <div
          className="flex-none"
          style={{ width: 'calc((100% - 75%) / 2 - 8px)' }}
        />
        </div>
      </div>
    </div>
  );
}

// 기록 입력 화면과 동일한 그리드 뷰
interface EntryGridViewProps {
  entry: Entry;
  blocks: BlockPosition[];
  selectedBlockIds: string[];
  albumId: string;
  hideHeader?: boolean;
}

function EntryGridView({ entry, blocks, selectedBlockIds, albumId, hideHeader = false }: EntryGridViewProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 블록 값 맵
  const valueMap = useMemo(() => {
    return new Map(entry.blockValues.map(bv => [bv.blockId, bv.value]));
  }, [entry.blockValues]);

  // 표시할 블록 (필터 적용 또는 전체)
  const displayBlocks = selectedBlockIds.length > 0
    ? blocks.filter(b => selectedBlockIds.includes(b.id))
    : blocks;

  // 컨테이너 너비 감지
  const setContainerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

    if (!node) return;

    const updateWidth = () => {
      const width = node.clientWidth;
      setGridWidth(width > 0 ? width : 300);
    };

    updateWidth();

    resizeObserverRef.current = new ResizeObserver(updateWidth);
    resizeObserverRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // 동적 행 높이 계산
  const rowHeight = useMemo(() => getRowHeight(gridWidth), [gridWidth]);

  // 블록 위치/크기 계산
  const getBlockStyle = useCallback((block: BlockPosition) => {
    const colWidth = (gridWidth - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
    const rows = calculateRows(block.height || rowHeight);

    return {
      left: block.colStart * (colWidth + MARGIN),
      top: block.row * (rowHeight + MARGIN),
      width: block.colSpan * colWidth + (block.colSpan - 1) * MARGIN,
      height: rows * rowHeight + (rows - 1) * MARGIN,
    };
  }, [gridWidth, rowHeight]);

  // 그리드 전체 높이 계산
  const gridHeight = useMemo(() => {
    if (displayBlocks.length === 0) return 200;
    const maxBottom = displayBlocks.reduce((max, block) => {
      const rows = calculateRows(block.height || rowHeight);
      const bottom = (block.row + rows) * (rowHeight + MARGIN);
      return Math.max(max, bottom);
    }, 0);
    return maxBottom;
  }, [displayBlocks, rowHeight]);

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 블록 값 가져오기
  const getBlockValue = useCallback((block: BlockPosition): BlockDefaultValue | undefined => {
    return valueMap.get(block.id) || block.defaultValue;
  }, [valueMap]);

  return (
    <div className="h-full">
      {/* 날짜/시간 헤더 - hideHeader가 true면 숨김 */}
      {!hideHeader && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <p className="font-medium text-gray-900">{formatDate(entry.createdAt)}</p>
          <p className="text-sm text-gray-500">{formatTime(entry.createdAt)}</p>
        </div>
      )}

      {/* 블록 그리드 레이아웃 */}
      <div
        ref={setContainerRefCallback}
        className="mx-4 my-4 relative"
        style={{ height: gridHeight, minHeight: 200 }}
      >
        {gridWidth > 0 && displayBlocks.map((block) => {
          const paletteItem = blockPalette.find(p => p.type === block.type);
          const Icon = iconMap[paletteItem?.icon || 'Type'];
          const style = getBlockStyle(block);
          const currentValue = getBlockValue(block);

          return (
            <div
              key={block.id}
              className="absolute bg-white border-2 border-gray-900 rounded-lg shadow-sm overflow-hidden"
              style={{
                left: style.left,
                top: style.top,
                width: style.width,
                height: style.height,
              }}
            >
              {/* 헤더 영역 */}
              <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-2 bg-gray-900 rounded-t-[4px] z-10">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white truncate">
                    {block.customLabel || paletteItem?.label}
                  </span>
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="absolute inset-0 pt-8 overflow-y-auto">
                <BlockContentPreview block={block} value={currentValue} albumId={albumId} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 블록 콘텐츠 프리뷰
interface BlockContentPreviewProps {
  block: BlockPosition;
  value?: BlockDefaultValue;
  albumId: string;
}

function BlockContentPreview({ block, value, albumId }: BlockContentPreviewProps) {
  // 텍스트
  if (block.type === 'text' && value?.type === 'text' && value.value.richText && value.value.richText !== '<p></p>') {
    return (
      <div
        className="block-preview p-2 text-xs text-gray-600 leading-relaxed break-words whitespace-pre-wrap"
        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        dangerouslySetInnerHTML={{ __html: value.value.richText }}
      />
    );
  }

  // 체크리스트
  if (block.type === 'checklist' && value?.type === 'checklist' && value.value.html) {
    return (
      <div
        className="checklist-preview p-2 text-xs text-gray-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: value.value.html }}
      />
    );
  }

  // 날씨
  if (block.type === 'weather' && value?.type === 'weather' && value.value.weather) {
    const info = getWeatherInfo(value.value.weather);
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <span className="text-4xl">{info?.emoji}</span>
        <span className="text-xs text-gray-600 mt-1">{info?.label}</span>
      </div>
    );
  }

  // 감정
  if (block.type === 'emotion' && value?.type === 'emotion' && value.value.emotion) {
    const info = getEmotionInfo(value.value.emotion);
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <span className="text-4xl">{info?.emoji}</span>
        <span className="text-xs text-gray-600 mt-1">{info?.label}</span>
      </div>
    );
  }

  // 이미지
  if (block.type === 'image' && value?.type === 'image' && value.value.images.filter(img => img).length > 0) {
    return (
      <SwipeablePreview>
        {value.value.images.filter(img => img).map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`이미지 ${idx + 1}`}
            className="w-full h-full object-cover"
          />
        ))}
      </SwipeablePreview>
    );
  }

  // 비디오
  if (block.type === 'video' && value?.type === 'video' && value.value.videos.filter(v => v).length > 0) {
    return (
      <SwipeablePreview>
        {value.value.videos.filter(v => v).map((video, idx) => (
          <video
            key={idx}
            src={video}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ))}
      </SwipeablePreview>
    );
  }

  // 링크
  if (block.type === 'link' && value?.type === 'link' && value.value.links?.length > 0) {
    return (
      <SwipeablePreview>
        {value.value.links.map((link, idx) => (
          <LinkBlockPreview key={idx} link={{ links: [link] }} />
        ))}
      </SwipeablePreview>
    );
  }

  // 파일
  if (block.type === 'file' && value?.type === 'file' && value.value.files?.filter(f => f.data).length > 0) {
    return (
      <SwipeablePreview>
        {value.value.files.filter(f => f.data).map((file, idx) => (
          <FileBlockPreview key={idx} file={{ files: [file] }} />
        ))}
      </SwipeablePreview>
    );
  }

  // 날짜
  if (block.type === 'date' && value?.type === 'date' && value.value.date) {
    return <DateBlockPreview date={value.value} />;
  }

  // 타임라인
  if (block.type === 'timeline' && value?.type === 'timeline' && value.value.items?.length > 0) {
    return <TimelineBlockPreview value={value.value} />;
  }

  // 데이터 그래프
  if (block.type === 'dataGraph' && block.defaultValue?.type === 'dataGraph' && block.defaultValue.value.fields?.length > 0) {
    return (
      <DataGraphBlockPreview
        value={{
          fields: block.defaultValue.value.fields,
          values: value?.type === 'dataGraph' ? value.value.values : undefined
        }}
        albumId={albumId}
        blockId={block.id}
      />
    );
  }

  // 지도
  if (block.type === 'map' && value?.type === 'map' && value.value.markers?.length > 0) {
    return <MapBlockPreview value={value.value} />;
  }

  // 달성도
  if (block.type === 'progress' && value?.type === 'progress' && (value.value.title || value.value.targetDate || (value.value.currentValue !== undefined && value.value.currentValue > 0))) {
    return <ProgressBlockPreview value={value.value} />;
  }

  // 입력 없음
  return (
    <div className="h-full flex items-center justify-center">
      <span className="text-xs text-gray-400">입력 없음</span>
    </div>
  );
}
