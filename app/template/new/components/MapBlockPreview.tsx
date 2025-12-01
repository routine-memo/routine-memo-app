'use client';

import { MapPin } from 'lucide-react';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { MapBlockDefault } from '../types';
import useKakaoLoader from '@/lib/hooks/useKakaoLoader';

interface MapBlockPreviewProps {
  value?: MapBlockDefault;
}

export const MapBlockPreview = ({ value }: MapBlockPreviewProps) => {
  const { loading, error } = useKakaoLoader();
  const markers = value?.markers || [];
  const center = value?.center || { lat: 37.5665, lng: 126.9780 };
  const level = value?.level || 5;

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
    <div className="h-full w-full rounded-xl overflow-hidden">
      <Map
        center={center}
        level={level}
        style={{ width: '100%', height: '100%' }}
        draggable={false}
        zoomable={false}
        disableDoubleClick={true}
        disableDoubleClickZoom={true}
      >
        {/* 마커들 표시 */}
        {markers.map((marker) => (
          <CustomOverlayMap
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center"
              style={{ backgroundColor: marker.color }}
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </CustomOverlayMap>
        ))}
      </Map>
    </div>
  );
};
