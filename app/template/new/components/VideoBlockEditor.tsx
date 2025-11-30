'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Plus, X, Video, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { VideoBlockDefault } from '../types';

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
    const [videos, setVideos] = useState<string[]>(initialValue?.videos || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false); // 에디터에서는 음소거 해제가 기본
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showControls, setShowControls] = useState(true); // 컨트롤 표시 여부

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const videoContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrollingRef = useRef(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // 컨트롤 자동 숨김 타이머 시작
    const startControlsTimer = useCallback(() => {
      // 기존 타이머 클리어
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // 3초 후 컨트롤 숨김
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
      // 언마운트 시 타이머 클리어
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, []); // 마운트 시 1회만 실행

    // 영상 인덱스 변경 시 컨트롤 표시
    const prevIndexRef = useRef(currentIndex);
    useEffect(() => {
      // 실제로 인덱스가 변경된 경우에만 실행
      if (prevIndexRef.current !== currentIndex && videos.length > 0) {
        prevIndexRef.current = currentIndex;
        showControlsWithTimer();
      }
    }, [currentIndex, showControlsWithTimer, videos.length]);

    // 현재 영상 ref
    const currentVideo = videoRefs.current[currentIndex];

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

    // 시간 업데이트 핸들러 - 매 프레임마다 호출됨
    const handleTimeUpdate = useCallback((index: number) => {
      const video = videoRefs.current[index];
      if (video && index === currentIndex) {
        setCurrentTime(video.currentTime);
        // duration이 아직 설정되지 않았다면 설정
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

    // 영상 터치/클릭 핸들러 (컨트롤 표시/숨김 토글)
    const handleVideoClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (showControls) {
        // 컨트롤이 보이는 상태에서 클릭하면 숨김
        setShowControls(false);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      } else {
        // 컨트롤이 숨겨진 상태에서 클릭하면 표시 + 타이머 시작
        showControlsWithTimer();
      }
    }, [showControls, showControlsWithTimer]);

    // 재생/일시정지 토글
    const togglePlayPause = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer(); // 타이머 리셋
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
      showControlsWithTimer(); // 타이머 리셋
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }, [currentIndex, isMuted, showControlsWithTimer]);

    // 볼륨 변경
    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      showControlsWithTimer(); // 타이머 리셋
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

    // 재생 위치 변경 (프로그레스 바 클릭)
    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      showControlsWithTimer(); // 타이머 리셋
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

    // 전체화면 토글 - 컨테이너를 전체화면으로 (커스텀 컨트롤 유지)
    const toggleFullscreen = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      showControlsWithTimer();
      const videoContainer = videoContainerRefs.current[currentIndex];
      if (videoContainer) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          videoContainer.requestFullscreen().catch(() => {});
        }
      }
    }, [currentIndex, showControlsWithTimer]);

    // 영상 추가 핸들러
    const handleAddVideos = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const loadedVideos = await Promise.all(
          Array.from(files).map(file => readFile(file))
        );
        setVideos(prev => [...prev, ...loadedVideos]);
      } catch (error) {
        console.error('Error loading videos:', error);
      }

      e.target.value = '';
    }, []);

    // 영상 삭제 핸들러
    const handleRemoveVideo = useCallback((index: number) => {
      setVideos((prev) => {
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
      if (!containerRef.current || videos.length === 0) return;

      const container = containerRef.current;
      const itemHeight = 280;
      const gap = 16;

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
      setCurrentTime(0);
      setDuration(0);
    }, [videos.length]);

    // 스크롤 이벤트 핸들러
    const handleScroll = useCallback(() => {
      if (!containerRef.current || isScrollingRef.current || videos.length === 0) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const itemHeight = 280 * 0.4 + 16;

      const newIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(newIndex, videos.length - 1));

      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
        setCurrentTime(0);
        setDuration(0);
      }
    }, [currentIndex, videos.length]);

    // 스크롤 종료 시 스냅
    const handleScrollEnd = useCallback(() => {
      if (isScrollingRef.current) return;
      scrollToIndex(currentIndex);
    }, [currentIndex, scrollToIndex]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ videos });
    }, [videos, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    // 파일 입력 요소
    const fileInput = (
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleAddVideos}
        className="hidden"
      />
    );

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="flex flex-col h-full bg-gray-100">
        {fileInput}

        {videos.length === 0 ? (
          // 영상이 없을 때 - 중앙에 추가 버튼
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
          // 영상이 있을 때 - 수직 캐러셀
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
              {/* 상단 패딩 (첫 영상이 중앙에 오도록) */}
              <div style={{ height: 'calc(50% - 140px)' }} />

              {videos.map((video, index) => {
                const isActive = index === currentIndex;
                const distance = Math.abs(index - currentIndex);

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
                    onClick={() => !isActive && scrollToIndex(index)}
                  >
                    <div
                      ref={el => { videoContainerRefs.current[index] = el; }}
                      className="relative overflow-hidden shadow-2xl bg-black"
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

                      {/* 활성 영상일 때 컨트롤 */}
                      {isActive && (
                        <>
                          {/* 삭제 버튼 - 항상 표시 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveVideo(index);
                            }}
                            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>

                          {/* 하단 컨트롤 바 - 조건부 표시 */}
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
                                {/* 재생/일시정지 */}
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

                                {/* 볼륨 컨트롤 */}
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

                                  {/* 볼륨 슬라이더 */}
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

                                {/* 시간 표시 */}
                                <span className="text-white text-xs">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                              </div>

                              {/* 전체화면 버튼 */}
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

              {/* 하단 패딩 (마지막 영상이 중앙에 오도록) */}
              <div style={{ height: 'calc(50% - 140px)' }} />
            </div>

            {/* 하단 컨트롤 영역 */}
            <div className="flex-none p-4 bg-white border-t border-gray-200">
              {/* 썸네일 리스트 */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                {videos.map((video, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-black ${
                      index === currentIndex
                        ? 'border-amber-500 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <video
                      src={video}
                      className="w-full h-full object-cover"
                      muted
                    />
                  </button>
                ))}
              </div>

              {/* 영상 추가 버튼 */}
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
      </div>
    );
  }
);

VideoBlockEditorInner.displayName = 'VideoBlockEditorInner';

export const VideoBlockEditor = VideoBlockEditorInner;
