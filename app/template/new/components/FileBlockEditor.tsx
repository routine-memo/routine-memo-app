'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Plus, Trash2, FilePlus, FileText, FileAudio, File, Download, Loader2 } from 'lucide-react';
import { FileBlockDefault, FileItem } from '../types';
import { useCarousel } from '../hooks/useCarousel';

interface FileBlockEditorProps {
  initialValue?: FileBlockDefault;
  onChange: (value: FileBlockDefault) => void;
}

export interface FileBlockEditorHandle {
  save: () => Promise<void>;
}

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 파일 타입에 따른 아이콘 반환 (이미지/영상 제외)
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
};

// 파일 확장자 추출
const getFileExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  return ext.length > 5 ? ext.substring(0, 5) : ext;
};

// 미리보기 가능한 파일인지 확인 (이미지/영상 제외)
const isPreviewable = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf'
  );
};

// 파일 타입 카테고리 반환 (이미지/영상 제외)
const getFileCategory = (mimeType: string): 'audio' | 'pdf' | 'other' => {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
};

const FileBlockEditorInner = forwardRef<FileBlockEditorHandle, FileBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 캐러셀 훅 사용
    const {
      items: files,
      currentIndex,
      containerRef,
      isScrollingRef,
      setItems: setFiles,
      setCurrentIndex,
      scrollToIndex,
      handleScroll,
      handleScrollEnd,
      removeItem: handleRemoveFile,
      getItemStyle,
    } = useCarousel<FileItem>(initialValue?.files || []);

    // onChange를 ref로 관리
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 파일이 변경될 때 부모에게 알림
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onChangeRef.current({ files });
    }, [files]);

    // 이미지/영상 파일인지 확인 (제외할 타입)
    const isMediaFile = (mimeType: string): boolean => {
      return mimeType.startsWith('image/') || mimeType.startsWith('video/');
    };

    // 파일 추가 핸들러
    const handleAddFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputFiles = e.target.files;
      if (!inputFiles || inputFiles.length === 0) return;

      // 이미지/영상 파일 제외
      const filteredFiles = Array.from(inputFiles).filter(file => !isMediaFile(file.type));

      if (filteredFiles.length === 0) {
        alert('이미지와 영상은 각각 이미지 블록, 영상 블록을 사용해주세요.');
        e.target.value = '';
        return;
      }

      const newIndex = files.length;

      // 1. 먼저 플레이스홀더로 상태 업데이트
      const placeholders: FileItem[] = filteredFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        data: '', // 빈 문자열 = 로딩 중
        lastModified: file.lastModified,
      }));
      setFiles(prev => [...prev, ...placeholders]);

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

      // 3. 백그라운드에서 실제 파일 로드
      filteredFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setFiles(prev => {
            const updated = [...prev];
            if (updated[newIndex + idx]) {
              updated[newIndex + idx] = {
                ...updated[newIndex + idx],
                data: result,
              };
            }
            return updated;
          });
        };
        reader.readAsDataURL(file);
      });

      e.target.value = '';
    }, [files.length, containerRef, isScrollingRef, setFiles, setCurrentIndex]);

    // 파일 다운로드
    const handleDownload = useCallback((file: FileItem) => {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, []);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ files });
    }, [files, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    return (
      <div className="flex flex-col h-full bg-gray-100">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleAddFiles}
          className="hidden"
        />

        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <FilePlus className="w-12 h-12 text-gray-400" />
              <span className="text-gray-600 font-medium">파일 추가</span>
            </button>
          </div>
        ) : (
          <>
            {/* 파일 카운트 */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
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
              <div style={{ height: 'calc(50% - 100px)' }} />

              {files.map((file, index) => {
                const { isActive, scale, opacity, blur } = getItemStyle(index);
                const FileIcon = getFileIcon(file.type);
                const extension = getFileExtension(file.name);
                const category = getFileCategory(file.type);
                const canPreview = isPreviewable(file.type);

                return (
                  <div
                    key={index}
                    className="flex justify-center items-center px-4"
                    style={{
                      height: isActive ? (canPreview ? '280px' : '200px') : '128px',
                      scrollSnapAlign: 'center',
                      transition: 'all 0.3s ease-out',
                      marginBottom: '16px',
                    }}
                    onClick={() => !isActive && scrollToIndex(index)}
                  >
                    <div
                      className={`relative overflow-hidden shadow-xl ${canPreview ? 'bg-black' : 'bg-white'}`}
                      style={{
                        width: isActive ? '100%' : '90%',
                        height: '100%',
                        borderRadius: '16px',
                        transform: `scale(${scale})`,
                        opacity,
                        filter: blur > 0 ? `blur(${blur}px)` : 'none',
                        transition: 'all 0.3s ease-out',
                      }}
                    >
                      {/* 로딩 중 (플레이스홀더) */}
                      {!file.data ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                          <p className="text-gray-500 text-sm line-clamp-2 break-all px-4 text-center">
                            {file.name}
                          </p>
                        </div>
                      ) : canPreview ? (
                        <>
                          {/* 오디오 미리보기 */}
                          {category === 'audio' && (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 p-4">
                              <FileAudio className="w-16 h-16 text-white mb-4" />
                              <p className="text-white font-medium text-sm line-clamp-2 max-w-full px-4 text-center break-all">
                                {file.name}
                              </p>
                              {isActive && (
                                <audio
                                  src={file.data}
                                  controls
                                  className="w-full mt-4"
                                />
                              )}
                            </div>
                          )}

                          {/* PDF 미리보기 */}
                          {category === 'pdf' && (
                            isActive ? (
                              <iframe
                                src={file.data}
                                className="w-full h-full bg-white"
                                title={file.name}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600 p-4">
                                <FileText className="w-16 h-16 text-white mb-4" />
                                <p className="text-white font-medium text-sm line-clamp-2 max-w-full px-4 text-center break-all">
                                  {file.name}
                                </p>
                              </div>
                            )
                          )}

                          {/* 파일 정보 오버레이 */}
                          {!(category === 'pdf' && isActive) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <p className="text-white text-xs line-clamp-2 break-all">{file.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] text-white font-medium">
                                  {extension}
                                </span>
                                <span className="text-[10px] text-white/70">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 액션 버튼들 */}
                          {isActive && (
                            <div className="absolute top-3 right-3 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                              >
                                <Download className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(index);
                                }}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* 미리보기 불가능한 파일 - 카드 스타일 */
                        <div className="flex items-center h-full p-4 gap-4">
                          <div className="flex-none w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <FileIcon className="w-8 h-8 text-gray-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium line-clamp-2 text-sm break-all">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500 font-medium">
                                {extension}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          </div>

                          {isActive && (
                            <div className="flex-none flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(index);
                                }}
                                className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div style={{ height: 'calc(50% - 100px)' }} />
            </div>

            {/* 하단 컨트롤 영역 */}
            <div className="flex-none p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  const isLoading = !file.data;

                  return (
                    <button
                      key={index}
                      onClick={() => scrollToIndex(index)}
                      className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${
                        index === currentIndex
                          ? 'border-gray-900 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      } ${index === currentIndex ? 'bg-gray-100' : 'bg-gray-100'}`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : (
                        <FileIcon className={`w-6 h-6 ${index === currentIndex ? 'text-gray-900' : 'text-gray-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                파일 추가
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

FileBlockEditorInner.displayName = 'FileBlockEditorInner';

export const FileBlockEditor = FileBlockEditorInner;
