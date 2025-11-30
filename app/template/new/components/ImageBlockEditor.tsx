'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Plus, X, ImagePlus } from 'lucide-react';
import { ImageBlockDefault } from '../types';

interface ImageBlockEditorProps {
  initialValue?: ImageBlockDefault;
  onChange: (value: ImageBlockDefault) => void;
}

export interface ImageBlockEditorHandle {
  save: () => Promise<void>;
}

const ImageBlockEditorInner = forwardRef<ImageBlockEditorHandle, ImageBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const [images, setImages] = useState<string[]>(initialValue?.images || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);

    // onChange를 ref로 관리해서 의존성 문제 해결
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 이미지가 변경될 때 부모에게 알림 (초기 렌더링 제외)
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onChangeRef.current({ images });
    }, [images]);

    // 이미지 추가 핸들러
    const handleAddImages = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const readFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        const loadedImages = await Promise.all(
          Array.from(files).map(file => readFile(file))
        );
        setImages(prev => [...prev, ...loadedImages]);
      } catch (error) {
        console.error('Error loading images:', error);
      }

      e.target.value = '';
    }, []);

    // 이미지 삭제 핸들러
    const handleRemoveImage = useCallback((index: number) => {
      setImages((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        if (currentIndex >= updated.length && updated.length > 0) {
          setCurrentIndex(updated.length - 1);
        } else if (updated.length === 0) {
          setCurrentIndex(0);
        }
        return updated;
      });
    }, [currentIndex]);

    // 특정 인덱스로 스크롤
    const scrollToIndex = useCallback((index: number) => {
      if (!containerRef.current || images.length === 0) return;

      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      const itemHeight = 280; // 메인 이미지 높이
      const gap = 16;

      // 중앙에 위치하도록 계산
      const scrollPosition = index * (itemHeight * 0.4 + gap);

      isScrollingRef.current = true;
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);

      setCurrentIndex(index);
    }, [images.length]);

    // 스크롤 이벤트 핸들러
    const handleScroll = useCallback(() => {
      if (!containerRef.current || isScrollingRef.current || images.length === 0) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const itemHeight = 280 * 0.4 + 16;

      const newIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(newIndex, images.length - 1));

      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    }, [currentIndex, images.length]);

    // 스크롤 종료 시 스냅
    const handleScrollEnd = useCallback(() => {
      if (isScrollingRef.current) return;
      scrollToIndex(currentIndex);
    }, [currentIndex, scrollToIndex]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ images });
    }, [images, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    // 파일 입력 요소
    const fileInput = (
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddImages}
        className="hidden"
      />
    );

    return (
      <div className="flex flex-col h-full bg-gray-100">
        {fileInput}

        {images.length === 0 ? (
          // 이미지가 없을 때 - 중앙에 추가 버튼
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all"
            >
              <ImagePlus className="w-12 h-12 text-gray-400" />
              <span className="text-gray-600 font-medium">이미지 추가</span>
            </button>
          </div>
        ) : (
          // 이미지가 있을 때 - 수직 캐러셀
          <>
            {/* 이미지 카운트 */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
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
              {/* 상단 패딩 (첫 이미지가 중앙에 오도록) */}
              <div style={{ height: 'calc(50% - 140px)' }} />

              {images.map((img, index) => {
                const isActive = index === currentIndex;
                const distance = Math.abs(index - currentIndex);

                // 거리에 따른 스케일과 투명도 계산
                const scale = isActive ? 1 : Math.max(0.6, 1 - distance * 0.15);
                const opacity = isActive ? 1 : Math.max(0.5, 1 - distance * 0.2);
                const blur = isActive ? 0 : Math.min(distance * 2, 4);

                return (
                  <div
                    key={index}
                    className="flex justify-center items-center px-4"
                    style={{
                      height: isActive ? '280px' : '128px',
                      scrollSnapAlign: 'center',
                      transition: 'all 0.3s ease-out',
                      marginBottom: '16px',
                    }}
                    onClick={() => scrollToIndex(index)}
                  >
                    <div
                      className="relative overflow-hidden shadow-2xl"
                      style={{
                        width: isActive ? '100%' : '85%',
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
                        className="w-full h-full object-cover"
                      />

                      {/* 활성 이미지일 때 삭제 버튼 */}
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 하단 패딩 (마지막 이미지가 중앙에 오도록) */}
              <div style={{ height: 'calc(50% - 140px)' }} />
            </div>

            {/* 하단 컨트롤 영역 */}
            <div className="flex-none p-4 bg-white border-t border-gray-200">
              {/* 썸네일 리스트 */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-amber-500 shadow-md'
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

              {/* 이미지 추가 버튼 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                이미지 추가
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

ImageBlockEditorInner.displayName = 'ImageBlockEditorInner';

export const ImageBlockEditor = ImageBlockEditorInner;
