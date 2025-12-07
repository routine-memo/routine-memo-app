'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Plus, Trash2, ImagePlus, Download, Loader2 } from 'lucide-react';
import { ImageBlockDefault } from '../types';
import { useCarousel } from '../hooks/useCarousel';
import { uploadMedia } from '@/lib/api/media';

interface ImageBlockEditorProps {
  initialValue?: ImageBlockDefault;
  onChange: (value: ImageBlockDefault) => void;
}

export interface ImageBlockEditorHandle {
  save: () => Promise<void>;
}

const ImageBlockEditorInner = forwardRef<ImageBlockEditorHandle, ImageBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 캐러셀 훅 사용
    const {
      items: images,
      currentIndex,
      containerRef,
      isScrollingRef,
      setItems: setImages,
      setCurrentIndex,
      scrollToIndex,
      handleScroll,
      handleScrollEnd,
      removeItem: handleRemoveImage,
      getItemStyle,
    } = useCarousel<string>(initialValue?.images || []);

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

      const fileArray = Array.from(files);
      const newIndex = images.length;
      const placeholderCount = fileArray.length;

      // 1. 먼저 플레이스홀더로 상태 업데이트 (빈 문자열)
      const placeholders = new Array(placeholderCount).fill('');
      setImages(prev => [...prev, ...placeholders]);

      // 2. 즉시 캐러셀 이동
      setTimeout(() => {
        if (containerRef.current) {
          const inactiveHeight = 128;
          const gap = 16;
          const scrollPosition = newIndex * (inactiveHeight + gap);

          isScrollingRef.current = true;
          containerRef.current.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });

          setTimeout(() => {
            isScrollingRef.current = false;
          }, 300);
        }
        setCurrentIndex(newIndex);
      }, 50);

      // 3. 백그라운드에서 Vercel Blob에 업로드
      fileArray.forEach(async (file, idx) => {
        try {
          const result = await uploadMedia(file);
          setImages(prev => {
            const updated = [...prev];
            updated[newIndex + idx] = result.url;
            return updated;
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
          // 업로드 실패 시 해당 플레이스홀더 제거
          setImages(prev => {
            const updated = [...prev];
            updated.splice(newIndex + idx, 1);
            return updated;
          });
        }
      });

      e.target.value = '';
    }, [images.length, containerRef, isScrollingRef, setImages, setCurrentIndex]);

    // 전체화면 모달 토글 (모바일 호환)
    const toggleFullscreen = useCallback(() => {
      setIsFullscreen(prev => !prev);
    }, []);

    // 이미지 다운로드
    const handleDownload = useCallback(async (imageData: string, index: number) => {
      try {
        // URL인 경우 fetch로 blob 가져오기
        if (imageData.startsWith('http')) {
          const response = await fetch(imageData);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const ext = blob.type.split('/')[1] || 'png';
          link.download = `image_${index + 1}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // base64인 경우 기존 방식
          const link = document.createElement('a');
          link.href = imageData;
          const mimeMatch = imageData.match(/data:image\/(\w+);/);
          const ext = mimeMatch ? mimeMatch[1] : 'png';
          link.download = `image_${index + 1}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Failed to download image:', error);
      }
    }, []);

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
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
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
                      {/* 로딩 중 (플레이스홀더) */}
                      {!img ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      ) : (
                        <img
                          src={img}
                          alt={`이미지 ${index + 1}`}
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={isActive ? (e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                          } : undefined}
                        />
                      )}

                      {/* 활성 이미지일 때 버튼들 */}
                      {isActive && img && (
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
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
                    className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-gray-200 flex items-center justify-center ${
                      index === currentIndex
                        ? 'border-gray-900 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={`썸네일 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </button>
                ))}
              </div>

              {/* 이미지 추가 버튼 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                이미지 추가
              </button>
            </div>
          </>
        )}

        {/* 전체화면 모달 (모바일 호환) */}
        {isFullscreen && images[currentIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={toggleFullscreen}
          >
            {/* 상단 컨트롤 */}
            <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
              {/* 이미지 카운트 */}
              <div className="flex-1 flex justify-center">
                {images.length > 1 && (
                  <div className="px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}
              </div>
              {/* 다운로드 버튼 */}
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

            {/* 전체화면 이미지 - 클릭하면 닫힘 */}
            <img
              src={images[currentIndex]}
              alt={`이미지 ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain cursor-pointer"
            />

            {/* 이전/다음 버튼 (여러 이미지일 때) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                    setCurrentIndex(prevIndex);
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
                    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                    setCurrentIndex(nextIndex);
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
);

ImageBlockEditorInner.displayName = 'ImageBlockEditorInner';

export const ImageBlockEditor = ImageBlockEditorInner;
