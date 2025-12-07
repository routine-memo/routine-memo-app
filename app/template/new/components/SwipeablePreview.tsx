'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeablePreviewProps {
  children: React.ReactNode[];
  showIndicator?: boolean;
  showArrows?: boolean;
}

export const SwipeablePreview = ({
  children,
  showIndicator = true,
  showArrows = true
}: SwipeablePreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const itemCount = children.length;

  const goToNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(prev => (prev < itemCount - 1 ? prev + 1 : prev));
  }, [itemCount]);

  const goToPrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 30; // 최소 스와이프 거리

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 왼쪽으로 스와이프 -> 다음
        goToNext();
      } else {
        // 오른쪽으로 스와이프 -> 이전
        goToPrev();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [goToNext, goToPrev]);

  if (itemCount === 0) return null;
  if (itemCount === 1) return <>{children[0]}</>;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 슬라이드 컨테이너 */}
      <div
        className="h-full w-full flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {children.map((child, index) => (
          <div key={index} className="h-full w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>

      {/* 좌우 화살표 - 호버 시 표시 */}
      {showArrows && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-0.5 top-1/2 -translate-y-1/2 p-0.5 bg-black/40 hover:bg-black/60 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-3 h-3 text-white" />
            </button>
          )}
          {currentIndex < itemCount - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 p-0.5 bg-black/40 hover:bg-black/60 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-3 h-3 text-white" />
            </button>
          )}
        </>
      )}

      {/* 인디케이터 */}
      {showIndicator && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {children.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-1 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* 카운트 뱃지 */}
      <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white font-medium">
        {currentIndex + 1}/{itemCount}
      </div>
    </div>
  );
};
