'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, Download, Target, Calendar, Percent, Globe, ExternalLink, Play, MapPin, Type, PenTool } from 'lucide-react';
import { Entry, getEntriesByAlbum } from '@/lib/storage/entry';
import { BlockPosition, BlockDefaultValue, LinkItem, DataGraphField, DataGraphValue } from '@/app/template/new/types';
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
import { Map as KakaoMap, CustomOverlayMap } from 'react-kakao-maps-sdk';
import useKakaoLoader from '@/lib/hooks/useKakaoLoader';
import { ProgressBlockPreview } from '@/app/template/new/components/ProgressBlockPreview';
import { SwipeablePreview } from '@/app/template/new/components/SwipeablePreview';
import { useCarousel } from '@/app/template/new/hooks/useCarousel';

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
  const [isBlockDetailOpen, setIsBlockDetailOpen] = useState(false);
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

    // 블록 상세 뷰가 열려있을 때는 스크롤 무시
    if (isBlockDetailOpen) return;

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
  }, [viewProgress, itemCount, animateToProgress, isBlockDetailOpen]);

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

  // 블록 상세뷰가 닫힐 때 스크롤 위치 복원
  const prevBlockDetailOpen = useRef(isBlockDetailOpen);
  useEffect(() => {
    if (prevBlockDetailOpen.current && !isBlockDetailOpen) {
      // 상세뷰가 닫혔을 때 현재 인덱스로 스크롤 위치 복원
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const cardWidth = container.clientWidth * 0.75;
        const gap = 16;
        container.scrollLeft = currentIndex * (cardWidth + gap);
      }
    }
    prevBlockDetailOpen.current = isBlockDetailOpen;
  }, [isBlockDetailOpen, currentIndex]);

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

  // 카드 높이: 88% (캐러셀) -> 100% (전체화면)
  const cardHeightPercent = 88 + 12 * viewProgress;

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
              top: 'calc(3% - 22px)',
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
          onScroll={viewProgress < 0.1 && !isAnimating && !isBlockDetailOpen ? handleScroll : undefined}
          className="h-full flex items-start snap-x snap-mandatory scroll-smooth"
          style={{
            overflowX: viewProgress > 0.5 || isBlockDetailOpen ? 'hidden' : 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            gap: '16px',
            paddingTop: '3%',
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
              className="flex-none snap-center bg-white overflow-hidden relative"
              style={{
                width: isActive ? `${75 + 25 * viewProgress}%` : '75%',
                maxWidth: isActive && viewProgress > 0.5 ? 'none' : (isActive ? `${360 + 640 * viewProgress}px` : '360px'),
                // 전체화면일 때 높이를 calc로 명시 (헤더 90px 제외)
                height: isActive && viewProgress > 0.5 ? 'calc(100vh - 90px)' : (isActive ? `${cardHeightPercent}%` : '88%'),
                maxHeight: isActive && viewProgress > 0.5 ? 'none' : (isActive ? `${700 + 300 * viewProgress}px` : '700px'),
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
              {/* 전체화면 모드일 때만 스크롤 가능 */}
              {isActive && viewProgress > 0.5 ? (
                <div
                  className="absolute inset-0 overflow-y-auto"
                  style={{
                    paddingTop: 90,
                    paddingBottom: 40,
                  }}
                >
                  <EntryGridView
                    entry={entry}
                    blocks={blocks}
                    selectedBlockIds={selectedBlockIds}
                    albumId={albumId}
                    hideHeader={true}
                    disableBlockClick={false}
                    onBlockSelectChange={setIsBlockDetailOpen}
                  />
                </div>
              ) : (
                <div className="h-full overflow-hidden">
                  <EntryGridView
                    entry={entry}
                    blocks={blocks}
                    selectedBlockIds={selectedBlockIds}
                    albumId={albumId}
                    hideHeader={true}
                    disableBlockClick={viewProgress < 0.5}
                    onBlockSelectChange={setIsBlockDetailOpen}
                  />
                </div>
              )}
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
  disableBlockClick?: boolean;
  onBlockSelectChange?: (isSelected: boolean) => void;
}

function EntryGridView({ entry, blocks, selectedBlockIds, albumId, hideHeader = false, disableBlockClick = false, onBlockSelectChange }: EntryGridViewProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockPosition | null>(null);

  // 블록 선택 상태가 변경되면 부모에게 알림
  const handleBlockSelect = useCallback((block: BlockPosition | null) => {
    setSelectedBlock(block);
    onBlockSelectChange?.(block !== null);
  }, [onBlockSelectChange]);

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
    <div>
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
        style={{ height: gridHeight + 100, minHeight: 200 }}
      >
        {gridWidth > 0 && displayBlocks.map((block) => {
          const paletteItem = blockPalette.find(p => p.type === block.type);
          const Icon = iconMap[paletteItem?.icon || 'Type'];
          const style = getBlockStyle(block);
          const currentValue = getBlockValue(block);

          return (
            <div
              key={block.id}
              onClick={(e) => {
                if (!disableBlockClick) {
                  e.stopPropagation();
                  handleBlockSelect(block);
                }
                // disableBlockClick일 때는 이벤트가 카드로 전파되어 전체화면 전환됨
              }}
              className={`absolute bg-white border-2 border-gray-900 rounded-lg shadow-sm overflow-hidden transition-colors ${
                disableBlockClick ? '' : 'cursor-pointer hover:border-gray-700'
              }`}
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
                <BlockContentPreview block={block} value={currentValue} albumId={albumId} entryDate={entry.createdAt} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 블록 상세 패널 */}
      <BlockDetailPanel
        block={selectedBlock}
        value={selectedBlock ? getBlockValue(selectedBlock) : undefined}
        albumId={albumId}
        entryDate={entry.createdAt}
        onClose={() => handleBlockSelect(null)}
      />
    </div>
  );
}

// 블록 콘텐츠 프리뷰
interface BlockContentPreviewProps {
  block: BlockPosition;
  value?: BlockDefaultValue;
  albumId: string;
  entryDate: string;
}

function BlockContentPreview({ block, value, albumId, entryDate }: BlockContentPreviewProps) {
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
        entryDate={entryDate}
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

// 블록 상세 패널 (전체 화면 슬라이드 업)
interface BlockDetailPanelProps {
  block: BlockPosition | null;
  value?: BlockDefaultValue;
  albumId: string;
  entryDate: string;
  onClose: () => void;
}

function BlockDetailPanel({ block, value, albumId, entryDate, onClose }: BlockDetailPanelProps) {
  const paletteItem = block ? blockPalette.find(p => p.type === block.type) : null;
  const Icon = iconMap[paletteItem?.icon || 'Type'];
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 렌더링 (Portal 사용을 위해)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && block) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, block]);

  // 서버에서는 렌더링하지 않음
  if (!mounted) return null;

  // Portal을 사용하여 document.body에 직접 렌더링 (stacking context 문제 해결)
  return createPortal(
    <div
      className={`
        fixed inset-0 z-[60] transition-all duration-300 ease-out
        ${block ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* 배경 오버레이 */}
      <div
        className={`
          absolute inset-0 bg-black/50 transition-opacity duration-300
          ${block ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* 편집 패널 - 전체 화면 */}
      <div
        className={`
          absolute inset-0 bg-white
          transition-transform duration-300 ease-out
          ${block ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {block && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* 패널 헤더 - flex-none으로 고정 높이 */}
            <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-900">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">
                  {block.customLabel || paletteItem?.label}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 콘텐츠 영역 - flex-1로 나머지 공간 차지 */}
            <div className="flex-1 overflow-hidden">
              <BlockDetailContent block={block} value={value} albumId={albumId} entryDate={entryDate} />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// 블록 상세 콘텐츠 (모달용 - 에디터와 동일한 UI)
function BlockDetailContent({ block, value, albumId, entryDate }: { block: BlockPosition; value?: BlockDefaultValue; albumId: string; entryDate: string }) {
  // 텍스트 - TextBlockEditor 스타일 (텍스트 또는 필기 데이터가 있을 때)
  if (block.type === 'text' && value?.type === 'text' &&
      ((value.value.richText && value.value.richText !== '<p></p>') || value.value.sketchData)) {
    return <TextBlockViewer value={value.value} />;
  }

  // 체크리스트 - ChecklistBlockEditor 스타일
  if (block.type === 'checklist' && value?.type === 'checklist' && value.value.html) {
    return <ChecklistBlockViewer html={value.value.html} />;
  }

  // 날씨 - WeatherBlockEditor 스타일
  if (block.type === 'weather' && value?.type === 'weather' && value.value.weather) {
    return <WeatherBlockViewer weather={value.value.weather} />;
  }

  // 감정 - EmotionBlockEditor 스타일
  if (block.type === 'emotion' && value?.type === 'emotion' && value.value.emotion) {
    return <EmotionBlockViewer emotion={value.value.emotion} />;
  }

  // 이미지
  if (block.type === 'image' && value?.type === 'image' && value.value.images.filter(img => img).length > 0) {
    const images = value.value.images.filter(img => img);
    return <ImageBlockViewer images={images} />;
  }

  // 비디오
  if (block.type === 'video' && value?.type === 'video' && value.value.videos.filter(v => v).length > 0) {
    const videos = value.value.videos.filter(v => v);
    return <VideoBlockViewer videos={videos} />;
  }

  // 링크
  if (block.type === 'link' && value?.type === 'link' && value.value.links?.length > 0) {
    return <LinkBlockViewer links={value.value.links} />;
  }

  // 파일
  if (block.type === 'file' && value?.type === 'file' && value.value.files?.filter(f => f.data).length > 0) {
    const files = value.value.files.filter(f => f.data);
    return <FileBlockViewer files={files} />;
  }

  // 날짜 - DateBlockEditor 스타일
  if (block.type === 'date' && value?.type === 'date' && value.value.date) {
    return <DateBlockViewer date={value.value.date} />;
  }

  // 타임라인 - TimelineBlockEditor 스타일
  if (block.type === 'timeline' && value?.type === 'timeline' && value.value.items?.length > 0) {
    return <TimelineBlockViewer items={value.value.items} />;
  }

  // 데이터 그래프 - DataGraphBlockEditor 스타일
  if (block.type === 'dataGraph' && block.defaultValue?.type === 'dataGraph' && block.defaultValue.value.fields?.length > 0) {
    return (
      <DataGraphBlockViewer
        fields={block.defaultValue.value.fields}
        values={value?.type === 'dataGraph' ? value.value.values : undefined}
        albumId={albumId}
        blockId={block.id}
        entryDate={entryDate}
      />
    );
  }

  // 지도 - MapBlockEditor 스타일
  if (block.type === 'map' && value?.type === 'map' && value.value.markers?.length > 0) {
    return <MapBlockViewer value={value.value} />;
  }

  // 달성도 - ProgressBlockEditor 스타일
  if (block.type === 'progress' && value?.type === 'progress') {
    return <ProgressBlockViewer value={value.value} />;
  }

  // 입력 없음
  return (
    <div className="flex items-center justify-center py-12">
      <span className="text-gray-400">입력된 내용이 없습니다</span>
    </div>
  );
}

// 텍스트 블록 뷰어 - TextBlockEditor 스타일
function TextBlockViewer({ value }: { value: { richText?: string; sketchData?: string } }) {
  const hasRichText = value.richText && value.richText !== '<p></p>';
  const hasSketch = !!value.sketchData;

  // 둘 다 있으면 탭 전환 가능, 아니면 있는 것만 표시
  const [activeTab, setActiveTab] = useState<'text' | 'sketch'>(hasRichText ? 'text' : 'sketch');

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 탭 헤더 - 둘 다 있을 때만 탭 표시 */}
      {hasRichText && hasSketch && (
        <div className="flex-none flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'text'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Type className="w-4 h-4" />
            텍스트
          </button>
          <button
            onClick={() => setActiveTab('sketch')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'sketch'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <PenTool className="w-4 h-4" />
            필기
          </button>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'text' && hasRichText ? (
          <div className="h-full overflow-y-auto p-4">
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: value.richText || '' }}
            />
          </div>
        ) : activeTab === 'sketch' && hasSketch ? (
          <SketchViewer sketchData={value.sketchData!} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            내용이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

// 필기 데이터 뷰어 (react-sketch-canvas 경로 데이터를 SVG로 렌더링)
function SketchViewer({ sketchData }: { sketchData: string }) {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    try {
      const paths = JSON.parse(sketchData);
      if (Array.isArray(paths) && paths.length > 0) {
        // 경로 데이터를 SVG로 변환
        const svgPaths = paths.map((path: { strokeColor: string; strokeWidth: number; paths: Array<{ x: number; y: number }> }, index: number) => {
          if (!path.paths || path.paths.length === 0) return '';

          const d = path.paths.reduce((acc: string, point: { x: number; y: number }, i: number) => {
            if (i === 0) return `M ${point.x} ${point.y}`;
            return `${acc} L ${point.x} ${point.y}`;
          }, '');

          return `<path key="${index}" d="${d}" stroke="${path.strokeColor || '#000'}" stroke-width="${path.strokeWidth || 3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        }).join('');

        // 전체 경로의 범위 계산
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        paths.forEach((path: { paths: Array<{ x: number; y: number }> }) => {
          if (!path.paths) return;
          path.paths.forEach((point: { x: number; y: number }) => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        });

        // 여백 추가
        const padding = 20;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = maxX + padding;
        maxY = maxY + padding;

        const width = maxX - minX;
        const height = maxY - minY;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" preserveAspectRatio="xMidYMid meet">${svgPaths}</svg>`;
        setSvgContent(svg);
      }
    } catch (error) {
      console.error('Failed to parse sketch data:', error);
    }
  }, [sketchData]);

  if (!svgContent) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        필기 데이터를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-gray-50">
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}

// 체크리스트 블록 뷰어 - ChecklistBlockEditor 스타일
function ChecklistBlockViewer({ html }: { html: string }) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50">
        <span className="text-sm text-gray-600 px-2">체크리스트</span>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="checklist-preview text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

// 날씨 블록 뷰어 - WeatherBlockEditor 스타일
function WeatherBlockViewer({ weather }: { weather: string }) {
  const info = getWeatherInfo(weather as Parameters<typeof getWeatherInfo>[0]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm text-gray-600">선택된 날씨</span>
        {info && (
          <span className="text-xs text-gray-400">
            ({info.label})
          </span>
        )}
      </div>

      {/* 선택된 날씨 표시 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <span className="text-8xl mb-4">{info?.emoji}</span>
          <span className="text-2xl font-medium text-gray-700">{info?.label}</span>
        </div>
      </div>
    </div>
  );
}

// 감정 블록 뷰어 - EmotionBlockEditor 스타일
function EmotionBlockViewer({ emotion }: { emotion: string }) {
  const info = getEmotionInfo(emotion as Parameters<typeof getEmotionInfo>[0]);
  const isPositive = ['happy', 'joyful', 'glad', 'interested', 'passionate', 'fun', 'hopeful', 'comfortable', 'excited', 'pleasant'].includes(emotion);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm text-gray-600">선택된 감정</span>
        {info && (
          <span className="text-xs text-gray-400">
            ({info.label})
          </span>
        )}
      </div>

      {/* 선택된 감정 표시 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <div
            className={`p-6 rounded-3xl mb-4 ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <span className="text-8xl">{info?.emoji}</span>
          </div>
          <span className={`text-2xl font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {info?.label}
          </span>
          <span className={`text-sm mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '긍정적 감정' : '부정적 감정'}
          </span>
        </div>
      </div>
    </div>
  );
}

// 날짜 블록 뷰어 - DateBlockEditor 스타일 (iOS 스타일 캘린더 카드)
function DateBlockViewer({ date }: { date: string }) {
  const parsedDate = new Date(date);
  const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* iOS 스타일 날짜 카드 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="w-56 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
          }}
        >
          {/* 상단 고리 */}
          <div className="relative h-10 flex items-center justify-center gap-16">
            <div className="w-4 h-7 bg-white/90 rounded-full shadow-inner" />
            <div className="w-4 h-7 bg-white/90 rounded-full shadow-inner" />
          </div>

          {/* 날짜 표시 영역 */}
          <div
            className="bg-white/95 mx-3 mb-3 rounded-2xl py-6 px-4 text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,240,240,0.95) 100%)',
            }}
          >
            {/* 연도 */}
            <p className="text-xs text-gray-400 font-medium tracking-wider mb-1">
              {parsedDate.getFullYear()}
            </p>
            {/* 월 */}
            <p className="text-base text-gray-500 font-semibold mb-2">
              {parsedDate.getMonth() + 1}월
            </p>
            {/* 요일 */}
            <p
              className="text-xl font-bold mb-2"
              style={{
                color: parsedDate.getDay() === 0 ? '#FF3B30' :
                       parsedDate.getDay() === 6 ? '#007AFF' : '#FF6B35'
              }}
            >
              {WEEKDAYS_EN[parsedDate.getDay()]}
            </p>
            {/* 일 */}
            <p className="text-8xl font-bold text-gray-900 leading-none">
              {parsedDate.getDate()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 타임라인 블록 뷰어 - TimelineBlockEditor 스타일 (그리드 뷰)
function TimelineBlockViewer({ items }: { items: Array<{ id: string; title: string; rows: Array<{ hour: number; startCol: number; endCol: number }>; color: string }> }) {
  const START_HOUR = 6;
  const END_HOUR = 24;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const ROW_HEIGHT = 44;
  const COL_WIDTH = 45;
  const TOTAL_COLS = 5;

  // 아이템이 있는 시간 범위만 표시
  const usedHours = new Set<number>();
  items.forEach(item => {
    item.rows.forEach(row => {
      usedHours.add(row.hour);
    });
  });
  const sortedHours = Array.from(usedHours).sort((a, b) => a - b);
  const minHour = sortedHours.length > 0 ? Math.max(START_HOUR, sortedHours[0] - 1) : START_HOUR;
  const maxHour = sortedHours.length > 0 ? Math.min(END_HOUR, sortedHours[sortedHours.length - 1] + 2) : END_HOUR;
  const displayHours = maxHour - minHour;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 타임라인 그리드 */}
      <div className="flex-1 overflow-auto">
        <div className="inline-flex min-w-full">
          {/* 시간 레이블 열 */}
          <div className="flex-none w-14 bg-white border-r border-gray-300 sticky left-0 z-20">
            <div className="h-8 border-b border-gray-300" />
            {Array.from({ length: displayHours }).map((_, i) => {
              const hour = minHour + i;
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
          <div className="flex-1 bg-white relative">
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
              {Array.from({ length: displayHours }).map((_, hourIdx) => {
                const hour = minHour + hourIdx;
                return (
                  <div
                    key={hour}
                    className="flex border-b border-gray-200 relative"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {Array.from({ length: TOTAL_COLS }).map((_, col) => (
                      <div
                        key={col}
                        className="border-r border-gray-200"
                        style={{ width: COL_WIDTH, height: ROW_HEIGHT }}
                      />
                    ))}
                  </div>
                );
              })}

              {/* 아이템 렌더링 */}
              {items.map((item) => {
                if (item.rows.length === 0) return null;
                const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);

                return sortedRows.map((rowData, idx) => {
                  if (rowData.hour < minHour || rowData.hour >= maxHour) return null;
                  const colSpan = rowData.endCol - rowData.startCol;
                  const hasPrevRow = idx > 0;
                  const hasNextRow = idx < sortedRows.length - 1;

                  return (
                    <div
                      key={`${item.id}-${rowData.hour}`}
                      className="absolute flex items-center overflow-hidden"
                      style={{
                        backgroundColor: item.color,
                        left: rowData.startCol * COL_WIDTH + 2,
                        width: colSpan * COL_WIDTH - 4,
                        top: (rowData.hour - minHour) * ROW_HEIGHT + (hasPrevRow ? 0 : 2),
                        height: ROW_HEIGHT - (hasPrevRow ? 0 : 2) - (hasNextRow ? 0 : 2),
                        borderTopLeftRadius: !hasPrevRow ? '0.375rem' : 0,
                        borderTopRightRadius: !hasPrevRow ? '0.375rem' : 0,
                        borderBottomLeftRadius: !hasNextRow ? '0.375rem' : 0,
                        borderBottomRightRadius: !hasNextRow ? '0.375rem' : 0,
                      }}
                    >
                      {idx === 0 && (
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

      {/* 일정 목록 */}
      <div className="flex-none max-h-32 overflow-auto border-t bg-white">
        <div className="p-2 space-y-1">
          {items.map((item) => {
            const sortedRows = [...item.rows].sort((a, b) => a.hour - b.hour);
            const first = sortedRows[0];
            const last = sortedRows[sortedRows.length - 1];
            const startTime = `${first.hour.toString().padStart(2, '0')}:${(first.startCol * 15).toString().padStart(2, '0')}`;
            const endHour = last.endCol === 5 ? last.hour + 1 : last.hour;
            const endMinute = last.endCol === 5 ? 0 : last.endCol * 15;
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

            return (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-none"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title || '(제목 없음)'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {startTime} - {endTime}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 데이터 그래프 블록 뷰어 - 그래프 중심 UI
function DataGraphBlockViewer({
  fields,
  values,
  albumId,
  blockId,
  entryDate
}: {
  fields: DataGraphField[];
  values?: DataGraphValue[];
  albumId: string;
  blockId: string;
  entryDate: string;
}) {
  // 활성화된 필드 ID 목록 (초기값: 모든 필드 활성화)
  const [activeFieldIds, setActiveFieldIds] = useState<Set<string>>(() =>
    new Set(fields.map(f => f.id))
  );

  // 필드 토글 핸들러
  const toggleField = useCallback((fieldId: string) => {
    setActiveFieldIds(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        // 최소 1개는 활성화 유지
        if (next.size > 1) {
          next.delete(fieldId);
        }
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }, []);

  // values 배열을 Record<string, number>로 변환 (UI 표시용)
  const valuesMap = useMemo(() => {
    if (!values) return {};
    const map: Record<string, number> = {};
    values.forEach(v => {
      map[v.fieldId] = v.value;
    });
    return map;
  }, [values]);

  // 활성화된 필드만 필터링
  const activeFields = useMemo(() =>
    fields.filter(f => activeFieldIds.has(f.id)),
    [fields, activeFieldIds]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 현재 기록 값 - 상단에 간략히 표시 */}
      <div className="flex-none px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          {fields.map((field) => {
            const fieldValue = valuesMap[field.id];
            const displayValue = fieldValue !== undefined
              ? (field.format === 'percent' ? `${fieldValue}%` : fieldValue.toString())
              : '-';
            const isActive = activeFieldIds.has(field.id);

            return (
              <div
                key={field.id}
                className={`flex items-center gap-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: field.color }}
                />
                <span className="text-sm text-gray-600">{field.name}:</span>
                <span className="text-lg font-bold text-gray-900">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 그래프 영역 - 메인 */}
      <div className="flex-1 p-4 overflow-hidden">
        <DataGraphDetailChart
          fields={activeFields}
          values={values}
          albumId={albumId}
          blockId={blockId}
          entryDate={entryDate}
        />
      </div>

      {/* 범례 - 클릭 가능 */}
      <div className="flex-none px-4 py-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 justify-center">
          {fields.map((field) => {
            const isActive = activeFieldIds.has(field.id);
            return (
              <button
                key={field.id}
                onClick={() => toggleField(field.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${
                  isActive
                    ? 'border-gray-300 bg-white'
                    : 'border-gray-200 bg-gray-100 opacity-50'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-opacity ${isActive ? '' : 'opacity-40'}`}
                  style={{ backgroundColor: field.color }}
                />
                <span className={`text-xs ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                  {field.name}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          탭하여 그래프 표시/숨김
        </p>
      </div>
    </div>
  );
}

// 데이터 그래프 상세 차트 (숫자값 표시 포함)
function DataGraphDetailChart({
  fields,
  values,
  albumId,
  blockId,
  entryDate
}: {
  fields: DataGraphField[];
  values?: DataGraphValue[];
  albumId: string;
  blockId: string;
  entryDate: string;
}) {
  // 앨범의 기록에서 데이터 수집
  const dataPoints = useMemo(() => {
    if (!albumId || !blockId) return [];

    const entries = getEntriesByAlbum(albumId);
    // 시간순 정렬 (오래된 것 → 최신)
    let sortedEntries = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // entryDate까지의 기록만 필터링
    if (entryDate) {
      const entryDateTime = new Date(entryDate).getTime();
      sortedEntries = sortedEntries.filter(
        entry => new Date(entry.createdAt).getTime() <= entryDateTime
      );
    }

    const points: Array<{ date: string; values: Map<string, number> }> = [];

    for (const entry of sortedEntries) {
      const blockValue = entry.blockValues.find(bv => bv.blockId === blockId);
      if (blockValue?.value?.type === 'dataGraph' && blockValue.value.value.values) {
        const valuesMap = new Map<string, number>();
        blockValue.value.value.values.forEach(v => {
          valuesMap.set(v.fieldId, v.value);
        });
        if (valuesMap.size > 0) {
          points.push({
            date: entry.createdAt,
            values: valuesMap,
          });
        }
      }
    }

    return points;
  }, [albumId, blockId, entryDate]);

  // 각 필드별 min/max 계산
  const fieldStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();

    fields.forEach(field => {
      let min = Infinity;
      let max = -Infinity;

      dataPoints.forEach(dp => {
        const val = dp.values.get(field.id);
        if (val !== undefined) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });

      if (min === Infinity) {
        min = 0;
        max = 100;
      } else if (min === max) {
        min = min - 10;
        max = max + 10;
      }

      // 여유 공간 추가 (위아래 10%)
      const range = max - min;
      min = min - range * 0.1;
      max = max + range * 0.1;

      stats.set(field.id, { min, max });
    });

    return stats;
  }, [fields, dataPoints]);

  // 각 필드별 포인트 계산
  const fieldPaths = useMemo(() => {
    const activeFieldCount = fields.length;

    return fields.map((field, fieldIndex) => {
      const stats = fieldStats.get(field.id);
      if (!stats) return null;

      const points: Array<{ xPercent: number; yPercent: number; value: number }> = [];

      dataPoints.forEach((dp, i) => {
        const val = dp.values.get(field.id);
        if (val !== undefined) {
          let xPercent: number;

          if (dataPoints.length > 1) {
            // 여러 데이터 포인트가 있으면 기존 로직
            xPercent = (i / (dataPoints.length - 1)) * 100;
          } else {
            // 단일 데이터 포인트일 때 필드별로 수평 분산 배치
            // 필드 수에 따라 간격 조정 (중앙 정렬)
            if (activeFieldCount === 1) {
              xPercent = 50;
            } else {
              // 필드들을 30% ~ 70% 범위에 균등 배치
              const spacing = 40 / (activeFieldCount - 1);
              xPercent = 30 + (fieldIndex * spacing);
            }
          }

          const yPercent = 100 - ((val - stats.min) / (stats.max - stats.min)) * 100;
          points.push({ xPercent, yPercent, value: val });
        }
      });

      if (points.length === 0) return null;

      return { field, points };
    }).filter(Boolean) as Array<{ field: DataGraphField; points: Array<{ xPercent: number; yPercent: number; value: number }> }>;
  }, [fields, dataPoints, fieldStats]);

  if (dataPoints.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ padding: '30px 20px 20px 20px' }}>
      {/* SVG 선 그래프 */}
      <svg
        viewBox="0 0 100 100"
        className="absolute w-full h-full"
        style={{ top: 30, left: 20, right: 20, bottom: 20, width: 'calc(100% - 40px)', height: 'calc(100% - 50px)' }}
        preserveAspectRatio="none"
      >
        {/* 그리드 라인 */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0" y1={y} x2="100" y2={y}
            stroke="#e5e7eb"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* 데이터 라인 */}
        {fieldPaths.map((fp) => {
          if (fp.points.length < 2) return null;

          const d = fp.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.xPercent} ${p.yPercent}`
          ).join(' ');

          return (
            <path
              key={fp.field.id}
              d={d}
              fill="none"
              stroke={fp.field.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* 데이터 포인트 및 값 라벨 */}
      <div
        className="absolute"
        style={{ top: 30, left: 20, right: 20, bottom: 20, width: 'calc(100% - 40px)', height: 'calc(100% - 50px)' }}
      >
        {fieldPaths.map((fp) => (
          fp.points.map((point, idx) => (
            <div
              key={`${fp.field.id}-${idx}`}
              className="absolute flex flex-col items-center"
              style={{
                left: `${point.xPercent}%`,
                top: `${point.yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* 값 라벨 */}
              <span
                className="text-xs font-bold whitespace-nowrap"
                style={{
                  color: fp.field.color,
                  transform: 'translateY(-14px)',
                  textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white',
                }}
              >
                {fp.field.format === 'percent' ? `${point.value}%` : point.value}
              </span>
              {/* 점 */}
              <div
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{
                  backgroundColor: fp.field.color,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          ))
        ))}
      </div>

      {/* X축 라벨 (기록 번호) */}
      <div
        className="absolute flex justify-between text-xs text-gray-400"
        style={{ bottom: 0, left: 20, right: 20 }}
      >
        {dataPoints.map((_, idx) => (
          <span key={idx}>{idx + 1}</span>
        ))}
      </div>
    </div>
  );
}

// 지도 블록 뷰어 - MapBlockEditor 스타일
function MapBlockViewer({ value }: { value: { markers: Array<{ id: string; name: string; lat: number; lng: number; color: string; address?: string; memo?: string }>; center?: { lat: number; lng: number }; level?: number } }) {
  const { loading, error } = useKakaoLoader();
  const [selectedMarker, setSelectedMarker] = useState<typeof value.markers[0] | null>(null);
  const [center, setCenter] = useState(value.center || { lat: 37.5665, lng: 126.9780 });
  const level = value.level || 5;

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((marker: typeof value.markers[0]) => {
    setSelectedMarker(selectedMarker?.id === marker.id ? null : marker);
  }, [selectedMarker]);

  // 목록에서 마커 클릭 핸들러
  const handleListItemClick = useCallback((marker: typeof value.markers[0]) => {
    setCenter({ lat: marker.lat, lng: marker.lng });
    setSelectedMarker(marker);
  }, []);

  // 로딩 중
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">지도 로딩 중...</div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
        <MapPin className="w-8 h-8 mb-2" />
        <p className="text-sm text-center">
          카카오맵을 불러올 수 없습니다.<br />
          API 키를 확인해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 지도 */}
      <div className="flex-1 relative">
        <KakaoMap
          center={center}
          level={level}
          style={{ width: '100%', height: '100%' }}
          onCenterChanged={(map) => setCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() })}
        >
          {/* 마커들 */}
          {value.markers.map((marker) => (
            <CustomOverlayMap
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              yAnchor={1.3}
            >
              <button
                onClick={() => handleMarkerClick(marker)}
                className="flex flex-col items-center"
              >
                <div
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: marker.color,
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45), 0 3px 6px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <span
                  className="mt-1 px-2 py-0.5 bg-white rounded text-xs font-medium text-gray-800 max-w-[100px] truncate"
                  style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15)' }}
                >
                  {marker.name}
                </span>
              </button>
            </CustomOverlayMap>
          ))}

          {/* 선택된 마커 정보 */}
          {selectedMarker && (
            <CustomOverlayMap
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              xAnchor={0.5}
              yAnchor={0}
            >
              <div style={{ transform: 'translateY(calc(-100% - 83px - 8px))' }}>
                <div className="bg-white rounded-lg shadow-lg p-3 min-w-[150px] max-w-[200px]">
                  <p className="font-medium text-gray-900 text-sm break-words whitespace-pre-wrap">{selectedMarker.name}</p>
                  {selectedMarker.address && (
                    <p className="text-xs text-gray-500 mt-0.5 break-words whitespace-pre-wrap">{selectedMarker.address}</p>
                  )}
                  {selectedMarker.memo && (
                    <p className="text-xs text-gray-600 mt-1 border-t pt-1 break-words whitespace-pre-wrap">{selectedMarker.memo}</p>
                  )}
                </div>
              </div>
            </CustomOverlayMap>
          )}
        </KakaoMap>
      </div>

      {/* 마커 목록 */}
      {value.markers.length > 0 && (
        <div className="flex-none max-h-40 overflow-auto border-t">
          <div className="p-2 space-y-1">
            {value.markers.map((marker) => (
              <button
                key={marker.id}
                onClick={() => handleListItemClick(marker)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                  selectedMarker?.id === marker.id ? 'bg-gray-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-none"
                  style={{ backgroundColor: marker.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{marker.name}</p>
                  {marker.address && (
                    <p className="text-xs text-gray-500 truncate">{marker.address}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 달성도 블록 뷰어 - ProgressBlockEditor 스타일
function ProgressBlockViewer({ value }: { value: { mode?: string; title?: string; targetDate?: string; currentValue?: number; targetValue?: number } }) {
  const mode = value.mode || 'dday';

  // D-Day 계산
  const calculateDDay = () => {
    if (!value.targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(value.targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 퍼센트 계산
  const calculatePercent = () => {
    const targetVal = value.targetValue || 100;
    const currentVal = value.currentValue || 0;
    if (targetVal === 0) return 0;
    return Math.min(100, Math.round((currentVal / targetVal) * 100));
  };

  const dday = calculateDDay();
  const percent = calculatePercent();

  return (
    <div className="h-full flex flex-col bg-white p-4 overflow-auto">
      {/* 모드 표시 */}
      <div className="flex-none mb-4">
        <div className="flex gap-2">
          <div
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 ${
              mode === 'dday'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">D-Day</span>
          </div>
          <div
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 ${
              mode === 'percent'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            <Percent className="w-5 h-5" />
            <span className="font-medium">달성률</span>
          </div>
        </div>
      </div>

      {/* 목표 제목 */}
      <div className="flex-none mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          목표 제목
        </label>
        <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
          {value.title || '-'}
        </div>
      </div>

      {/* D-Day 모드 정보 */}
      {mode === 'dday' && (
        <div className="flex-none mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            목표 날짜
          </label>
          <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
            {value.targetDate ? new Date(value.targetDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : '-'}
          </div>
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

      {/* 퍼센트 모드 정보 */}
      {mode === 'percent' && (
        <>
          <div className="flex-none mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                현재 값
              </label>
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-center">
                {value.currentValue ?? 0}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                목표 값
              </label>
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-center">
                {value.targetValue ?? 100}
              </div>
            </div>
          </div>

          {/* 진행률 표시 */}
          <div className="flex-none mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">진행률</span>
              <span className="text-sm font-medium text-gray-900">{percent}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* 미리보기 카드 */}
      <div className="flex-1 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          미리보기
        </label>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-800">
              {value.title || '-'}
            </span>
          </div>
          {mode === 'dday' ? (
            <div className="text-center py-4">
              <span className="text-4xl font-bold text-gray-900">
                {dday !== null
                  ? dday === 0
                    ? 'D-Day'
                    : dday > 0
                    ? `D-${dday}`
                    : `D+${Math.abs(dday)}`
                  : 'D-?'}
              </span>
              {value.targetDate && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(value.targetDate).toLocaleDateString('ko-KR', {
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
                <span className="text-3xl font-bold text-gray-900">{percent}%</span>
                <span className="text-sm text-gray-500">
                  {value.currentValue ?? 0}/{value.targetValue ?? 100}
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-300"
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

// 이미지 블록 뷰어 (ImageBlockEditor와 동일한 UI, 보기 전용)
function ImageBlockViewer({ images }: { images: string[] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    currentIndex,
    containerRef,
    setCurrentIndex,
    scrollToIndex,
    handleScroll,
    handleScrollEnd,
    getItemStyle,
  } = useCarousel<string>(images);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleDownload = useCallback((imageData: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageData;
    const mimeMatch = imageData.match(/data:image\/(\w+);/);
    const ext = mimeMatch ? mimeMatch[1] : 'png';
    link.download = `image_${index + 1}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* 이미지 카운트 - 고정 헤더 */}
      <div className="flex-none flex justify-center py-3 bg-gray-100">
        <div className="px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* 수직 스크롤 캐러셀 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        {/* 상단 패딩 */}
        <div style={{ height: 'calc(50% - 140px)', minHeight: '60px' }} />

        {images.map((img, index) => {
          const { isActive, scale, opacity, blur, height, width } = getItemStyle(index);

          return (
            <div
              key={index}
              className="flex justify-center items-center px-4"
              style={{
                height,
                scrollSnapAlign: 'center',
                transition: 'all 0.3s ease-out',
                marginBottom: '16px',
              }}
              onClick={() => !isActive && scrollToIndex(index)}
            >
              <div
                className="relative overflow-hidden shadow-2xl bg-black"
                style={{
                  width,
                  height: '100%',
                  borderRadius: isActive ? '16px' : '24px',
                  transform: `scale(${scale})`,
                  opacity,
                  filter: blur > 0 ? `blur(${blur}px)` : 'none',
                  transition: 'all 0.3s ease-out',
                }}
              >
                <img
                  src={img}
                  alt={`이미지 ${index + 1}`}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={isActive ? (e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  } : undefined}
                />

                {/* 활성 이미지일 때 다운로드 버튼 */}
                {isActive && (
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(img, index);
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 하단 패딩 */}
        <div style={{ height: 'calc(50% - 140px)', minHeight: '60px' }} />
      </div>

      {/* 하단 썸네일 영역 */}
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-gray-900 shadow-md'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`썸네일 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* 전체화면 모달 - z-[100]으로 모든 UI 위에 표시 */}
      {isFullscreen && images[currentIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={toggleFullscreen}
        >
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
            <div className="flex-1 flex justify-center">
              {images.length > 1 && (
                <div className="px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(images[currentIndex], currentIndex);
              }}
              className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
          </div>

          <img
            src={images[currentIndex]}
            alt={`이미지 ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain cursor-pointer"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 비디오 블록 뷰어
function VideoBlockViewer({ videos }: { videos: string[] }) {
  const {
    currentIndex,
    containerRef,
    scrollToIndex,
    handleScroll,
    handleScrollEnd,
    getItemStyle,
  } = useCarousel<string>(videos);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 비디오 카운트 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {videos.length}
      </div>

      {/* 수직 스크롤 캐러셀 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        <div style={{ height: 'calc(50% - 140px)' }} />

        {videos.map((video, index) => {
          const { isActive, scale, opacity, blur, height, width } = getItemStyle(index);

          return (
            <div
              key={index}
              className="flex justify-center items-center px-4"
              style={{
                height,
                scrollSnapAlign: 'center',
                transition: 'all 0.3s ease-out',
                marginBottom: '16px',
              }}
              onClick={() => !isActive && scrollToIndex(index)}
            >
              <div
                className="relative overflow-hidden shadow-2xl bg-black"
                style={{
                  width,
                  height: '100%',
                  borderRadius: isActive ? '16px' : '24px',
                  transform: `scale(${scale})`,
                  opacity,
                  filter: blur > 0 ? `blur(${blur}px)` : 'none',
                  transition: 'all 0.3s ease-out',
                }}
              >
                <video
                  src={video}
                  className="w-full h-full object-contain"
                  controls={isActive}
                  playsInline
                />
              </div>
            </div>
          );
        })}

        <div style={{ height: 'calc(50% - 140px)' }} />
      </div>

      {/* 하단 썸네일 영역 */}
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {videos.map((video, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-gray-800 flex items-center justify-center ${
                index === currentIndex
                  ? 'border-gray-900 shadow-md'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <video src={video} className="w-full h-full object-cover" muted />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// URL에서 도메인 추출
const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

// YouTube 썸네일 URL 추출
const getYoutubeThumbnail = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
  }
  return null;
};

// YouTube 임베드 URL 변환
const getYoutubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

// YouTube 비디오인지 확인
const isYoutubeUrl = (url: string): boolean => {
  const domain = getDomain(url).toLowerCase();
  return domain.includes('youtube.com') || domain.includes('youtu.be');
};

// 링크 블록 뷰어 - LinkBlockEditor 스타일
function LinkBlockViewer({ links }: { links: LinkItem[] }) {
  const {
    currentIndex,
    containerRef,
    scrollToIndex,
    handleScroll,
    handleScrollEnd,
    getItemStyle,
  } = useCarousel<LinkItem>(links);

  // 링크 열기 핸들러
  const handleOpenLink = useCallback((e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // 링크 프리뷰 렌더링
  const renderLinkPreview = (link: LinkItem, isActive: boolean) => {
    const youtubeThumbnail = getYoutubeThumbnail(link.url);
    const youtubeEmbedUrl = getYoutubeEmbedUrl(link.url);
    const isYoutube = isYoutubeUrl(link.url);

    if (link.displayMode === 'embed' && isYoutube) {
      if (isActive && youtubeEmbedUrl) {
        return (
          <div className="h-full w-full relative bg-black rounded-2xl overflow-hidden">
            <iframe
              src={`${youtubeEmbedUrl}?autoplay=0&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      } else if (youtubeThumbnail) {
        return (
          <div className="h-full w-full relative bg-black rounded-2xl overflow-hidden">
            <img
              src={youtubeThumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div
        className="h-full w-full p-4 flex flex-col bg-white rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={isActive ? (e) => handleOpenLink(e, link.url) : undefined}
      >
        <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded-xl mb-3">
          {link.metadata?.favicon ? (
            <img
              src={link.metadata.favicon}
              alt=""
              className="w-16 h-16"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-16 h-16 text-gray-300" />
          )}
        </div>

        <div className="flex-none text-center">
          <p className="text-base font-medium text-gray-800 truncate">
            {link.metadata?.title || getDomain(link.url)}
          </p>
          <p className="text-sm text-gray-400 truncate flex items-center justify-center gap-1 mt-1">
            <ExternalLink className="w-3 h-3 flex-none" />
            {getDomain(link.url)}
          </p>
        </div>

        {isActive && (
          <div className="flex-none mt-2 text-center">
            <span className="text-xs text-gray-900 font-medium">탭하여 링크 열기</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 링크 카운트 */}
      <div className="flex-none flex justify-center py-3 bg-gray-100">
        <div className="px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
          {currentIndex + 1} / {links.length}
        </div>
      </div>

      {/* 수직 스크롤 캐러셀 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        <div style={{ height: 'calc(50% - 140px)', minHeight: '60px' }} />

        {links.map((link, index) => {
          const { isActive, scale, opacity, blur, height, width } = getItemStyle(index);

          return (
            <div
              key={index}
              className="flex justify-center items-center px-4"
              style={{
                height,
                scrollSnapAlign: 'center',
                transition: 'all 0.3s ease-out',
                marginBottom: '16px',
              }}
              onClick={() => !isActive && scrollToIndex(index)}
            >
              <div
                className="relative overflow-hidden shadow-2xl"
                style={{
                  width,
                  height: '100%',
                  borderRadius: '16px',
                  transform: `scale(${scale})`,
                  opacity,
                  filter: blur > 0 ? `blur(${blur}px)` : 'none',
                  transition: 'all 0.3s ease-out',
                }}
              >
                {renderLinkPreview(link, isActive)}
              </div>
            </div>
          );
        })}

        <div style={{ height: 'calc(50% - 140px)', minHeight: '60px' }} />
      </div>

      {/* 하단 썸네일/인디케이터 영역 */}
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
          {links.map((link, index) => {
            const isYoutube = isYoutubeUrl(link.url);
            const youtubeThumbnail = getYoutubeThumbnail(link.url);

            return (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${
                  index === currentIndex
                    ? 'border-gray-900 shadow-md'
                    : 'border-transparent opacity-70 hover:opacity-100'
                } ${isYoutube && youtubeThumbnail ? 'bg-black' : 'bg-gray-100'}`}
              >
                {isYoutube && youtubeThumbnail ? (
                  <img
                    src={youtubeThumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : link.metadata?.favicon ? (
                  <img
                    src={link.metadata.favicon}
                    alt=""
                    className="w-8 h-8"
                  />
                ) : (
                  <Globe className="w-6 h-6 text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 파일 블록 뷰어
function FileBlockViewer({ files }: { files: { name: string; data: string; size?: number }[] }) {
  const {
    currentIndex,
    containerRef,
    scrollToIndex,
    handleScroll,
    handleScrollEnd,
    getItemStyle,
  } = useCarousel<{ name: string; data: string; size?: number }>(files);

  const handleDownload = useCallback((file: { name: string; data: string }) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 파일 카운트 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {files.length}
      </div>

      {/* 수직 스크롤 캐러셀 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        <div style={{ height: 'calc(50% - 80px)' }} />

        {files.map((file, index) => {
          const { isActive, scale, opacity } = getItemStyle(index);

          return (
            <div
              key={index}
              className="flex justify-center items-center px-4"
              style={{
                height: isActive ? '160px' : '100px',
                scrollSnapAlign: 'center',
                transition: 'all 0.3s ease-out',
                marginBottom: '16px',
              }}
              onClick={() => !isActive && scrollToIndex(index)}
            >
              <div
                className="w-full max-w-md p-4 bg-white rounded-xl shadow-lg"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  transition: 'all 0.3s ease-out',
                }}
              >
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                  {isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                      className="p-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ height: 'calc(50% - 80px)' }} />
      </div>

      {/* 하단 인디케이터 */}
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 justify-center">
          {files.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-gray-900 w-4' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
