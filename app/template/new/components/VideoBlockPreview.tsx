'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoBlockPreviewProps {
  videos: string[];
}

export const VideoBlockPreview = ({ videos }: VideoBlockPreviewProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  return (
    <div className="h-full w-full relative">
      <video
        ref={videoRef}
        src={videos[0]}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        autoPlay
      />
      {/* 음소거 버튼 */}
      <button
        onClick={toggleMute}
        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10"
      >
        {isMuted ? (
          <VolumeX className="w-3 h-3 text-white" />
        ) : (
          <Volume2 className="w-3 h-3 text-white" />
        )}
      </button>
      {/* 영상 개수 표시 */}
      {videos.length > 1 && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
          +{videos.length - 1}
        </div>
      )}
    </div>
  );
};
