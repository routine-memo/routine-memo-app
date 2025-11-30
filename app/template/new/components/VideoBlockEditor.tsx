'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Plus, Trash2, Video, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { VideoBlockDefault } from '../types';
import { useCarousel } from '../hooks/useCarousel';

interface VideoBlockEditorProps {
  initialValue?: VideoBlockDefault;
  onChange: (value: VideoBlockDefault) => void;
}

export interface VideoBlockEditorHandle {
  save: () => Promise<void>;
}

// 시간 포맷 함수
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoBlockEditorInner = forwardRef<VideoBlockEditorHandle, VideoBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 캐러셀 훅 사용
    const {
      items: videos,
      currentIndex,
      containerRef,
      isScrollingRef,
      setItems: setVideos,
      setCurrentIndex,
      scrollToIndex,
      handleScroll: baseHandleScroll,
      handleScrollEnd,
      removeItem: handleRemoveVideo,
      getItemStyle,
    } = useCarousel<string>(initialValue?.videos || []);

    // onChange를 ref로 관리해서 의존성 문제 해결
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 영상이 변경될 때 부모에게 알림 (초기 렌더링 제외)
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onChangeRef.current({ videos });
    }, [videos]);

    // 스크롤 핸들러 래퍼 (시간 리셋 추가)
    const handleScroll = useCallback(() => {
      const prevIndex = currentIndex;
      baseHandleScroll();
      // 인덱스가 변경되면 시간 리셋 (useEffect에서 처리)
    }, [baseHandleScroll, currentIndex]);

    // 인덱스 변경 시 시간 리셋
    const prevIndexRef = useRef(currentIndex);
    useEffect(() => {
      if (prevIndexRef.current !== currentIndex) {
        prevIndexRef.current = currentIndex;
        setCurrentTime(0);
        setDuration(0);
      }
    }, [currentIndex]);

    // 컨트롤 자동 숨김 타이머 시작
    const startControlsTimer = useCallback(() => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }, []);

    // 컨트롤 표시 및 타이머 리셋
    const showControlsWithTimer = useCallback(() => {
      setShowControls(true);
      startControlsTimer();
    }, [startControlsTimer]);

    // 컴포넌트 마운트 시 컨트롤 표시 및 타이머 시작
    useEffect(() => {
      if (videos.length > 0) {
        showControlsWithTimer();
      }
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, []);

    // 영상 인덱스 변경 시 컨트롤 표시
    useEffect(() => {
      if (prevIndexRef.current !== currentIndex && videos.length > 0) {
        showControlsWithTimer();
      }
    }, [currentIndex, showControlsWithTimer, videos.length]);

    // 현재 인덱스가 변경될 때 자동 재생
    useEffect(() => {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            video.muted = isMuted;
            video.volume = volume;
            if (isPlaying) {
              video.play().catch(() => {});
            }
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    }, [currentIndex, isPlaying, isMuted, volume]);

    // 시간 업데이트 핸들러
    const handleTimeUpdate = useCallback((index: number) => {
      const video = videoRefs.current[index];
      if (video && index === currentIndex) {
        setCurrentTime(video.currentTime);
        if (video.duration && !isNaN(video.duration) && duration === 0) {
          setDuration(video.duration);
        }
      }
    }, [currentIndex, duration]);

    // 메타데이터 로드 핸들러
    const handleLoadedMetadata = useCallback((index: number) => {
      const video = videoRefs.current[index];
      if (video && index === currentIndex) {
        setDuration(video.duration);
        setCurrentTime(video.currentTime);
      }
    }, [currentIndex]);

    // 영상 터치/클릭 핸들러
    const handleVideoClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (showControls) {
        setShowControls(false);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      } else {
        showControlsWithTimer();
      }
    }, [showControls, showControlsWithTimer]);

    // 재생/일시정지 토글
    const togglePlayPause = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      const video = videoRefs.current[currentIndex];
      if (video) {
        if (isPlaying) {
          video.pause();
        } else {
          video.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
      }
    }, [currentIndex, isPlaying, showControlsWithTimer]);

    // 음소거 토글
    const toggleMute = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }, [currentIndex, isMuted, showControlsWithTimer]);

    // 볼륨 변경
    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      showControlsWithTimer();
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.volume = newVolume;
        if (newVolume === 0) {
          setIsMuted(true);
          video.muted = true;
        } else if (isMuted) {
          setIsMuted(false);
          video.muted = false;
        }
      }
    }, [currentIndex, isMuted, showControlsWithTimer]);

    // 재생 위치 변경
    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      showControlsWithTimer();
      const video = videoRefs.current[currentIndex];
      if (video && progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * video.duration;
        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }, [currentIndex, showControlsWithTimer]);

    // 전체화면 모달 토글
    const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      setIsFullscreen(prev => {
        if (!prev) {
          const currentVideo = videoRefs.current[currentIndex];
          if (currentVideo) {
            setCurrentTime(currentVideo.currentTime);
            setDuration(currentVideo.duration);
            currentVideo.pause();
          }
        } else {
          const currentVideo = videoRefs.current[currentIndex];
          if (currentVideo) {
            if (fullscreenVideoRef.current) {
              currentVideo.currentTime = fullscreenVideoRef.current.currentTime;
            }
            if (isPlaying) {
              currentVideo.play().catch(() => {});
            }
          }
        }
        return !prev;
      });

      setShowControls(true);
      startControlsTimer();
    }, [currentIndex, isPlaying, startControlsTimer]);

    // 전체화면 모달에서 이전/다음 영상
    const goToPrevVideo = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : videos.length - 1;
      setCurrentIndex(prevIndex);
      setCurrentTime(0);
      setDuration(0);
    }, [currentIndex, videos.length, showControlsWithTimer, setCurrentIndex]);

    const goToNextVideo = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      const nextIndex = currentIndex < videos.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(nextIndex);
      setCurrentTime(0);
      setDuration(0);
    }, [currentIndex, videos.length, showControlsWithTimer, setCurrentIndex]);

    // 전체화면 비디오 동기화
    useEffect(() => {
      if (isFullscreen && fullscreenVideoRef.current) {
        const fsVideo = fullscreenVideoRef.current;
        fsVideo.muted = isMuted;
        fsVideo.volume = volume;
        fsVideo.currentTime = currentTime;
        if (isPlaying) {
          fsVideo.play().catch(() => {});
        }
      }
    }, [isFullscreen]);

    // 전체화면 비디오 시간 업데이트
    const handleFullscreenTimeUpdate = useCallback(() => {
      if (fullscreenVideoRef.current) {
        setCurrentTime(fullscreenVideoRef.current.currentTime);
        if (fullscreenVideoRef.current.duration && !isNaN(fullscreenVideoRef.current.duration)) {
          setDuration(fullscreenVideoRef.current.duration);
        }
      }
    }, []);

    // 전체화면에서 재생/일시정지
    const toggleFullscreenPlayPause = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      if (fullscreenVideoRef.current) {
        if (isPlaying) {
          fullscreenVideoRef.current.pause();
        } else {
          fullscreenVideoRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
      }
    }, [isPlaying, showControlsWithTimer]);

    // 전체화면에서 음소거 토글
    const toggleFullscreenMute = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      if (fullscreenVideoRef.current) {
        fullscreenVideoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }, [isMuted, showControlsWithTimer]);

    // 전체화면에서 볼륨 변경
    const handleFullscreenVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      showControlsWithTimer();
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (fullscreenVideoRef.current) {
        fullscreenVideoRef.current.volume = newVolume;
        if (newVolume === 0) {
          setIsMuted(true);
          fullscreenVideoRef.current.muted = true;
        } else if (isMuted) {
          setIsMuted(false);
          fullscreenVideoRef.current.muted = false;
        }
      }
    }, [isMuted, showControlsWithTimer]);

    // 전체화면에서 재생 위치 변경
    const handleFullscreenProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      showControlsWithTimer();
      if (fullscreenVideoRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * fullscreenVideoRef.current.duration;
        fullscreenVideoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }, [showControlsWithTimer]);

    // 영상 다운로드
    const handleDownload = useCallback((videoData: string, index: number) => {
      const link = document.createElement('a');
      link.href = videoData;
      const mimeMatch = videoData.match(/data:video\/(\w+);/);
      const ext = mimeMatch ? mimeMatch[1] : 'mp4';
      link.download = `video_${index + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, []);

    // 영상 추가 핸들러
    const handleAddVideos = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const newIndex = videos.length;
      const placeholderCount = fileArray.length;

      // 1. 먼저 플레이스홀더로 상태 업데이트
      const placeholders = new Array(placeholderCount).fill('');
      setVideos(prev => [...prev, ...placeholders]);

      // 영상 추가 후 자동 재생
      setIsPlaying(true);

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
        setCurrentTime(0);
        setDuration(0);
      }, 50);

      // 3. 백그라운드에서 실제 영상 로드
      fileArray.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setVideos(prev => {
            const updated = [...prev];
            updated[newIndex + idx] = result;
            return updated;
          });
        };
        reader.readAsDataURL(file);
      });

      e.target.value = '';
    }, [videos.length, containerRef, isScrollingRef, setVideos, setCurrentIndex]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ videos });
    }, [videos, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="flex flex-col h-full bg-gray-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleAddVideos}
          className="hidden"
        />

        {videos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all"
            >
              <Video className="w-12 h-12 text-gray-400" />
              <span className="text-gray-600 font-medium">영상 추가</span>
            </button>
          </div>
        ) : (
          <>
            {/* 영상 카운트 */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
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
                      {/* 로딩 중 */}
                      {!video ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      ) : (
                        <video
                          ref={el => { videoRefs.current[index] = el; }}
                          src={video}
                          className="w-full h-full object-contain cursor-pointer"
                          loop
                          playsInline
                          onTimeUpdate={() => handleTimeUpdate(index)}
                          onLoadedMetadata={() => handleLoadedMetadata(index)}
                          onClick={isActive ? handleVideoClick : undefined}
                        />
                      )}

                      {/* 활성 영상일 때 컨트롤 */}
                      {isActive && video && (
                        <>
                          {/* 상단 버튼들 */}
                          <div className="absolute top-3 right-3 flex gap-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(video, index);
                              }}
                              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                            >
                              <Download className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVideo(index);
                              }}
                              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>

                          {/* 하단 컨트롤 바 */}
                          <div
                            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 transition-opacity duration-300 ${
                              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            {/* 프로그레스 바 */}
                            <div
                              ref={progressRef}
                              className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
                              onClick={handleProgressClick}
                            >
                              <div
                                className="h-full bg-amber-500 rounded-full relative"
                                style={{ width: `${progressPercent}%` }}
                              >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                              </div>
                            </div>

                            {/* 컨트롤 버튼들 */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={togglePlayPause}
                                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                                >
                                  {isPlaying ? (
                                    <Pause className="w-5 h-5 text-white" fill="white" />
                                  ) : (
                                    <Play className="w-5 h-5 text-white" fill="white" />
                                  )}
                                </button>

                                <div
                                  className="relative flex items-center"
                                  onMouseEnter={() => setShowVolumeSlider(true)}
                                  onMouseLeave={() => setShowVolumeSlider(false)}
                                >
                                  <button
                                    onClick={toggleMute}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                                  >
                                    {isMuted || volume === 0 ? (
                                      <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                      <Volume2 className="w-5 h-5 text-white" />
                                    )}
                                  </button>

                                  <div
                                    className={`ml-2 transition-all duration-200 overflow-hidden ${
                                      showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
                                    }`}
                                  >
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={isMuted ? 0 : volume}
                                      onChange={handleVolumeChange}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full h-1 accent-amber-500 cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <span className="text-white text-xs">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                              </div>

                              <button
                                onClick={toggleFullscreen}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                              >
                                <Maximize2 className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              <div style={{ height: 'calc(50% - 140px)' }} />
            </div>

            {/* 하단 컨트롤 영역 */}
            <div className="flex-none p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                {videos.map((video, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-black flex items-center justify-center ${
                      index === currentIndex
                        ? 'border-amber-500 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {video ? (
                      <video
                        src={video}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                영상 추가
              </button>
            </div>
          </>
        )}

        {/* 전체화면 모달 */}
        {isFullscreen && videos[currentIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black flex flex-col"
            onClick={() => {
              if (showControls) {
                setShowControls(false);
              } else {
                showControlsWithTimer();
              }
            }}
          >
            <div
              className={`absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="flex-1 flex justify-center">
                {videos.length > 1 && (
                  <div className="px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
                    {currentIndex + 1} / {videos.length}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(videos[currentIndex], currentIndex);
                }}
                className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <Download className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <video
                ref={fullscreenVideoRef}
                src={videos[currentIndex]}
                className="max-w-full max-h-full object-contain"
                loop
                playsInline
                autoPlay={isPlaying}
                muted={isMuted}
                onTimeUpdate={handleFullscreenTimeUpdate}
                onLoadedMetadata={() => {
                  if (fullscreenVideoRef.current) {
                    setDuration(fullscreenVideoRef.current.duration);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (showControls) {
                    setShowControls(false);
                    if (controlsTimeoutRef.current) {
                      clearTimeout(controlsTimeoutRef.current);
                    }
                  } else {
                    showControlsWithTimer();
                  }
                }}
              />
            </div>

            {videos.length > 1 && (
              <>
                <button
                  onClick={goToPrevVideo}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={goToNextVideo}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-full h-1.5 bg-white/30 rounded-full mb-4 cursor-pointer"
                onClick={handleFullscreenProgressClick}
              >
                <div
                  className="h-full bg-amber-500 rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleFullscreenPlayPause}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                      <Play className="w-6 h-6 text-white" fill="white" />
                    )}
                  </button>

                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={toggleFullscreenMute}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-6 h-6 text-white" />
                      ) : (
                        <Volume2 className="w-6 h-6 text-white" />
                      )}
                    </button>

                    <div
                      className={`ml-2 transition-all duration-200 overflow-hidden ${
                        showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'
                      }`}
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleFullscreenVolumeChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-1.5 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Minimize2 className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoBlockEditorInner.displayName = 'VideoBlockEditorInner';

export const VideoBlockEditor = VideoBlockEditorInner;
