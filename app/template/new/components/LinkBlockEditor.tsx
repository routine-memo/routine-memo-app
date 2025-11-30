'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Link2, ExternalLink, Image, Globe, Loader2, X, Check, Play, Pencil } from 'lucide-react';
import { LinkBlockDefault, LinkItem, LinkDisplayMode, LinkMetadata } from '../types';
import { useCarousel } from '../hooks/useCarousel';

interface LinkBlockEditorProps {
  initialValue?: LinkBlockDefault;
  onChange: (value: LinkBlockDefault) => void;
}

export interface LinkBlockEditorHandle {
  save: () => Promise<void>;
}

// URL 유효성 검사
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// URL에서 도메인 추출
const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

// 임베드 가능한 사이트인지 확인
const isEmbeddable = (url: string): boolean => {
  const domain = getDomain(url).toLowerCase();
  const embeddableDomains = [
    'youtube.com', 'youtu.be',
    'vimeo.com',
    'twitter.com', 'x.com',
    'instagram.com',
    'tiktok.com',
    'soundcloud.com',
    'spotify.com',
    'codepen.io',
    'codesandbox.io',
    'figma.com',
  ];
  return embeddableDomains.some(d => domain.includes(d));
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

// YouTube 썸네일 URL 추출
const getYoutubeThumbnail = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
  }
  return null;
};

// YouTube 비디오인지 확인
const isYoutubeUrl = (url: string): boolean => {
  const domain = getDomain(url).toLowerCase();
  return domain.includes('youtube.com') || domain.includes('youtu.be');
};

const LinkBlockEditorInner = forwardRef<LinkBlockEditorHandle, LinkBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 캐러셀 훅 사용
    const {
      items: links,
      currentIndex,
      containerRef,
      isScrollingRef,
      setItems: setLinks,
      setCurrentIndex,
      scrollToIndex,
      handleScroll,
      handleScrollEnd,
      removeItem: handleRemoveLink,
      getItemStyle,
    } = useCarousel<LinkItem>(initialValue?.links || []);

    // onChange를 ref로 관리
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 링크가 변경될 때 부모에게 알림
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onChangeRef.current({ links });
    }, [links]);

    // 메타데이터 가져오기
    const fetchMetadata = useCallback(async (targetUrl: string): Promise<LinkMetadata> => {
      const domain = getDomain(targetUrl);
      return {
        title: domain,
        siteName: domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    }, []);

    // 링크 추가 핸들러
    const handleAddLink = useCallback(async () => {
      if (!url || isLoading) return;

      if (!isValidUrl(url)) {
        setError('올바른 URL을 입력해주세요');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const metadata = await fetchMetadata(url);
        const canEmbed = isEmbeddable(url);

        const newLink: LinkItem = {
          url,
          displayMode: canEmbed ? 'embed' : 'preview',
          metadata,
        };

        setLinks(prev => {
          const updated = [...prev, newLink];
          setTimeout(() => {
            setCurrentIndex(updated.length - 1);
            scrollToIndex(updated.length - 1);
          }, 100);
          return updated;
        });

        setUrl('');
      } catch (err) {
        setError('링크 정보를 가져오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    }, [url, isLoading, fetchMetadata, setLinks, setCurrentIndex, scrollToIndex]);

    // URL 입력 핸들러
    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value);
      setError(null);
    }, []);

    // URL 붙여넣기 핸들러
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');
      if (isValidUrl(pastedText)) {
        e.preventDefault();
        setUrl(pastedText);
        setTimeout(async () => {
          if (!isValidUrl(pastedText)) return;

          setIsLoading(true);
          setError(null);

          try {
            const metadata = await fetchMetadata(pastedText);
            const canEmbed = isEmbeddable(pastedText);

            const newLink: LinkItem = {
              url: pastedText,
              displayMode: canEmbed ? 'embed' : 'preview',
              metadata,
            };

            setLinks(prev => {
              const updated = [...prev, newLink];
              setTimeout(() => {
                setCurrentIndex(updated.length - 1);
                scrollToIndex(updated.length - 1);
              }, 100);
              return updated;
            });

            setUrl('');
          } catch (err) {
            setError('링크 정보를 가져오는데 실패했습니다');
          } finally {
            setIsLoading(false);
          }
        }, 100);
      }
    }, [fetchMetadata, setLinks, setCurrentIndex, scrollToIndex]);

    // 디스플레이 모드 변경
    const handleDisplayModeChange = useCallback((mode: LinkDisplayMode) => {
      setLinks(prev => {
        const updated = [...prev];
        if (updated[currentIndex]) {
          updated[currentIndex] = { ...updated[currentIndex], displayMode: mode };
        }
        return updated;
      });
    }, [currentIndex, setLinks]);

    // 제목 변경
    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setLinks(prev => {
        const updated = [...prev];
        if (updated[currentIndex]) {
          updated[currentIndex] = {
            ...updated[currentIndex],
            metadata: {
              ...updated[currentIndex].metadata,
              title: newTitle,
            },
          };
        }
        return updated;
      });
    }, [currentIndex, setLinks]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ links });
    }, [links, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    // 현재 링크 정보
    const currentLink = links[currentIndex];
    const canEmbed = currentLink ? isEmbeddable(currentLink.url) : false;

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
              <span className="text-xs text-amber-600 font-medium">탭하여 링크 열기</span>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* URL 입력 영역 */}
        <div className="flex-none p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={handleUrlChange}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLink();
                  }
                }}
                placeholder="링크를 붙여넣거나 입력하세요"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddLink}
              disabled={!url || isLoading}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>

        {links.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Link2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">링크를 추가하세요</p>
            <p className="text-sm mt-1">URL을 붙여넣거나 입력하세요</p>
          </div>
        ) : (
          <>
            {/* 링크 카운트 */}
            <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {links.length}
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
                    onClick={() => {
                      if (!isActive) {
                        scrollToIndex(index);
                      }
                    }}
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

                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLink(index);
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

              <div style={{ height: 'calc(50% - 140px)' }} />
            </div>

            {/* 하단 컨트롤 영역 */}
            <div className="flex-none p-4 bg-white border-t border-gray-200">
              {currentLink && (
                <>
                  <div className="mb-3">
                    <div className="relative">
                      <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={currentLink.metadata?.title || ''}
                        onChange={handleTitleChange}
                        placeholder="링크 제목"
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDisplayModeChange('preview')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 transition-all text-sm ${
                          currentLink.displayMode === 'preview'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Image className="w-4 h-4" />
                        <span className="font-medium">미리보기</span>
                      </button>
                      <button
                        onClick={() => handleDisplayModeChange('embed')}
                        disabled={!canEmbed}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 transition-all text-sm ${
                          currentLink.displayMode === 'embed'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        } ${!canEmbed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="font-medium">임베드</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1">
                {links.map((link, index) => {
                  const isYoutube = isYoutubeUrl(link.url);
                  const youtubeThumbnail = getYoutubeThumbnail(link.url);

                  return (
                    <button
                      key={index}
                      onClick={() => scrollToIndex(index)}
                      className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${
                        index === currentIndex
                          ? 'border-amber-500 shadow-md'
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
          </>
        )}
      </div>
    );
  }
);

LinkBlockEditorInner.displayName = 'LinkBlockEditorInner';

export const LinkBlockEditor = LinkBlockEditorInner;
