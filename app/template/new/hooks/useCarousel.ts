'use client';

import { useState, useCallback, useRef } from 'react';

interface UseCarouselOptions {
  initialIndex?: number;
  inactiveHeight?: number;
  gap?: number;
}

interface UseCarouselReturn<T> {
  // 상태
  items: T[];
  currentIndex: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isScrollingRef: React.MutableRefObject<boolean>;

  // 액션
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  scrollToIndex: (index: number) => void;
  handleScroll: () => void;
  handleScrollEnd: () => void;

  // 아이템 추가 (플레이스홀더 패턴)
  addItemsWithPlaceholder: <P>(
    placeholders: P[],
    onScrollComplete?: () => void
  ) => void;

  // 아이템 삭제
  removeItem: (index: number) => void;

  // 스타일 계산 헬퍼
  getItemStyle: (index: number) => {
    isActive: boolean;
    scale: number;
    opacity: number;
    blur: number;
    height: string;
    width: string;
  };
}

export function useCarousel<T>(
  initialItems: T[] = [],
  options: UseCarouselOptions = {}
): UseCarouselReturn<T> {
  const {
    initialIndex = 0,
    inactiveHeight = 128,
    gap = 16,
  } = options;

  const [items, setItems] = useState<T[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);

  // 특정 인덱스로 스크롤
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current || items.length === 0) return;

    const container = containerRef.current;
    const scrollPosition = index * (inactiveHeight + gap);

    isScrollingRef.current = true;
    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);

    setCurrentIndex(index);
  }, [items.length, inactiveHeight, gap]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingRef.current || items.length === 0) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = inactiveHeight + gap;

    const newIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));

    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
    }
  }, [currentIndex, items.length, inactiveHeight, gap]);

  // 스크롤 종료 시 스냅
  const handleScrollEnd = useCallback(() => {
    if (isScrollingRef.current) return;
    scrollToIndex(currentIndex);
  }, [currentIndex, scrollToIndex]);

  // 아이템 추가 (플레이스홀더 패턴)
  const addItemsWithPlaceholder = useCallback(<P,>(
    placeholders: P[],
    onScrollComplete?: () => void
  ) => {
    const newIndex = items.length;

    // 1. 플레이스홀더로 상태 업데이트
    setItems(prev => [...prev, ...placeholders as unknown as T[]]);

    // 2. 즉시 캐러셀 이동
    setTimeout(() => {
      if (containerRef.current) {
        const scrollPosition = newIndex * (inactiveHeight + gap);

        isScrollingRef.current = true;
        containerRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });

        setTimeout(() => {
          isScrollingRef.current = false;
          onScrollComplete?.();
        }, 300);
      }
      setCurrentIndex(newIndex);
    }, 50);
  }, [items.length, inactiveHeight, gap]);

  // 아이템 삭제
  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (currentIndex >= updated.length && updated.length > 0) {
        setCurrentIndex(updated.length - 1);
      } else if (updated.length === 0) {
        setCurrentIndex(0);
      }
      return updated;
    });
  }, [currentIndex]);

  // 스타일 계산 헬퍼
  const getItemStyle = useCallback((index: number) => {
    const isActive = index === currentIndex;
    const distance = Math.abs(index - currentIndex);

    const scale = isActive ? 1 : Math.max(0.6, 1 - distance * 0.15);
    const opacity = isActive ? 1 : Math.max(0.5, 1 - distance * 0.2);
    const blur = isActive ? 0 : Math.min(distance * 2, 4);

    return {
      isActive,
      scale,
      opacity,
      blur,
      height: isActive ? '280px' : `${inactiveHeight}px`,
      width: isActive ? '100%' : '85%',
    };
  }, [currentIndex, inactiveHeight]);

  return {
    items,
    currentIndex,
    containerRef,
    isScrollingRef,
    setItems,
    setCurrentIndex,
    scrollToIndex,
    handleScroll,
    handleScrollEnd,
    addItemsWithPlaceholder,
    removeItem,
    getItemStyle,
  };
}
