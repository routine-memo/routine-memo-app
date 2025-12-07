'use client';

import { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { MapBlockDefault } from '../types';
import useKakaoLoader from '@/lib/hooks/useKakaoLoader';

interface MapBlockPreviewProps {
  value?: MapBlockDefault;
}

export const MapBlockPreview = ({ value }: MapBlockPreviewProps) => {
  const { loading, error } = useKakaoLoader();
  const markers = value?.markers || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // 현재 선택된 마커를 중심으로 설정
  const currentMarker = markers[currentIndex];
  const center = currentMarker
    ? { lat: currentMarker.lat, lng: currentMarker.lng }
    : value?.center || { lat: 37.5665, lng: 126.9780 };
  const level = value?.level || 5;

  // 이전/다음 마커로 이동
  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : markers.length - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < markers.length - 1 ? prev + 1 : 0));
  };

  // 마커가 없는 경우
  if (markers.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <MapPin className="w-6 h-6 mb-0.5" />
        <span className="text-[9px]">장소 없음</span>
      </div>
    );
  }

  // 로딩 중이거나 에러인 경우 기존 목록 뷰 표시
  if (loading || error) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden flex flex-col bg-white p-2">
        <div className="flex-none flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-[8px] text-gray-400">저장된 장소</span>
        </div>
        <div className="flex-1 overflow-hidden space-y-1">
          {markers.slice(0, 4).map((marker) => (
            <div key={marker.id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-none"
                style={{ backgroundColor: marker.color }}
              />
              <span className="text-[9px] text-gray-700 truncate font-medium">
                {marker.name}
              </span>
            </div>
          ))}
          {markers.length > 4 && (
            <span className="text-[8px] text-gray-400">
              +{markers.length - 4}개 더
            </span>
          )}
        </div>
      </div>
    );
  }

  // 실제 지도 표시
  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative">
      <Map
        center={center}
        level={level}
        style={{ width: '100%', height: '100%' }}
        draggable={false}
        zoomable={false}
        disableDoubleClick={true}
        disableDoubleClickZoom={true}
      >
        {/* 현재 마커만 표시 */}
        {currentMarker && (
          <CustomOverlayMap
            position={{ lat: currentMarker.lat, lng: currentMarker.lng }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                style={{
                  backgroundColor: currentMarker.color,
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45), 0 3px 6px rgba(0, 0, 0, 0.35)'
                }}
              >
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span
                className="mt-0.5 px-1.5 py-0.5 bg-white rounded text-[8px] font-medium text-gray-800 max-w-[80px] truncate"
                style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15)' }}
              >
                {currentMarker.name}
              </span>
            </div>
          </CustomOverlayMap>
        )}
      </Map>

      {/* 좌우 화살표 버튼 (마커가 2개 이상일 때만) */}
      {markers.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
            style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
          >
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
            style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
          >
            <ChevronRight className="w-3 h-3 text-gray-600" />
          </button>

          {/* 인디케이터 */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex gap-0.5">
            {markers.map((_, idx) => (
              <div
                key={idx}
                className={`w-1 h-1 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
