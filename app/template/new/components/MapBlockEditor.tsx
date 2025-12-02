'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { Map, MapMarker as KakaoMapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Plus, Trash2, Search, MapPin, X } from 'lucide-react';
import { MapBlockDefault, MapMarker } from '../types';
import useKakaoLoader from '@/lib/hooks/useKakaoLoader';

interface MapBlockEditorProps {
  initialValue?: MapBlockDefault;
  onChange: (value: MapBlockDefault) => void;
}

export interface MapBlockEditorHandle {
  save: () => Promise<void>;
}

// 기본 색상 팔레트
const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

// 기본 중심 좌표 (서울 시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };
const DEFAULT_LEVEL = 5;

const MapBlockEditorInner = forwardRef<MapBlockEditorHandle, MapBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const { loading, error } = useKakaoLoader();

    const [markers, setMarkers] = useState<MapMarker[]>(initialValue?.markers || []);
    const [center, setCenter] = useState(initialValue?.center || DEFAULT_CENTER);
    const [level, setLevel] = useState(initialValue?.level || DEFAULT_LEVEL);

    const [editingMarker, setEditingMarker] = useState<MapMarker | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<kakao.maps.services.PlacesSearchResult>([]);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    // onChange를 ref로 감싸서 무한 루프 방지
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 변경사항 전파
    useEffect(() => {
      onChangeRef.current({ markers, center, level });
    }, [markers, center, level]);

    // 저장 핸들러
    useImperativeHandle(ref, () => ({
      save: async () => {
        // 현재 상태가 이미 onChange로 전파됨
      },
    }));

    // 장소 검색
    const handleSearch = useCallback(() => {
      if (!searchKeyword.trim() || typeof window === 'undefined' || !window.kakao) return;

      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(searchKeyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      });
    }, [searchKeyword]);

    // 검색 결과에서 장소 선택
    const handleSelectPlace = useCallback((place: kakao.maps.services.PlacesSearchResultItem) => {
      const newMarker: MapMarker = {
        id: `marker-${Date.now()}`,
        name: place.place_name,
        address: place.road_address_name || place.address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        color: COLOR_PALETTE[markers.length % COLOR_PALETTE.length],
      };

      setEditingMarker(newMarker);
      setIsAddMode(true);
      setSearchResults([]);
      setSearchKeyword('');

      // 선택한 장소로 지도 이동
      setCenter({ lat: newMarker.lat, lng: newMarker.lng });
    }, [markers.length]);

    // 지도 클릭으로 마커 추가
    const handleMapClick = useCallback((_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
      if (!isAddMode) return;

      const latlng = mouseEvent.latLng;
      const newMarker: MapMarker = {
        id: `marker-${Date.now()}`,
        name: '',
        lat: latlng.getLat(),
        lng: latlng.getLng(),
        color: COLOR_PALETTE[markers.length % COLOR_PALETTE.length],
      };

      setEditingMarker(newMarker);
    }, [isAddMode, markers.length]);

    // 마커 저장
    const handleSaveMarker = useCallback((marker: MapMarker) => {
      if (!marker.name.trim()) return;

      const existingIndex = markers.findIndex(m => m.id === marker.id);
      if (existingIndex >= 0) {
        const updated = [...markers];
        updated[existingIndex] = marker;
        setMarkers(updated);
      } else {
        setMarkers([...markers, marker]);
      }

      setEditingMarker(null);
      setIsAddMode(false);
    }, [markers]);

    // 마커 삭제
    const handleDeleteMarker = useCallback((id: string) => {
      setMarkers(markers.filter(m => m.id !== id));
      setSelectedMarker(null);
    }, [markers]);

    // 로딩 중
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">지도 로딩 중...</div>
        </div>
      );
    }

    // 에러
    if (error) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
          <MapPin className="w-8 h-8 mb-2" />
          <p className="text-sm text-center">
            카카오맵을 불러올 수 없습니다.<br />
            API 키를 확인해주세요.
          </p>
        </div>
      );
    }

    // 마커 편집 폼
    if (editingMarker) {
      return (
        <div className="h-full flex flex-col bg-white">
          {/* 헤더 */}
          <div className="flex-none flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              {markers.find(m => m.id === editingMarker.id) ? '장소 수정' : '새 장소 추가'}
            </h3>
            <button
              onClick={() => {
                setEditingMarker(null);
                setIsAddMode(false);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 폼 */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* 장소 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                장소 이름
              </label>
              <input
                type="text"
                value={editingMarker.name}
                onChange={(e) => setEditingMarker({ ...editingMarker, name: e.target.value })}
                placeholder="예: 맛있는 카페, 단골 맛집"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                주소
              </label>
              <input
                type="text"
                value={editingMarker.address || ''}
                onChange={(e) => setEditingMarker({ ...editingMarker, address: e.target.value })}
                placeholder="주소 입력 (선택)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                메모
              </label>
              <textarea
                value={editingMarker.memo || ''}
                onChange={(e) => setEditingMarker({ ...editingMarker, memo: e.target.value })}
                placeholder="이 장소에 대한 메모 (선택)"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
            </div>

            {/* 마커 색상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                마커 색상
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditingMarker({ ...editingMarker, color })}
                    className={`w-9 h-9 rounded-full transition-transform ${
                      editingMarker.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* 미니 지도 미리보기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                위치
              </label>
              <div className="h-32 rounded-lg overflow-hidden border border-gray-200">
                <Map
                  center={{ lat: editingMarker.lat, lng: editingMarker.lng }}
                  level={3}
                  style={{ width: '100%', height: '100%' }}
                  draggable={false}
                  zoomable={false}
                >
                  <CustomOverlayMap position={{ lat: editingMarker.lat, lng: editingMarker.lng }}>
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: editingMarker.color }}
                    >
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                  </CustomOverlayMap>
                </Map>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                위도: {editingMarker.lat.toFixed(6)}, 경도: {editingMarker.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex-none p-4 border-t">
            <button
              onClick={() => handleSaveMarker(editingMarker)}
              disabled={!editingMarker.name.trim()}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      );
    }

    // 메인 에디터
    return (
      <div className="h-full flex flex-col bg-white">
        {/* 검색 바 */}
        <div className="flex-none p-3 border-b">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="장소 검색..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              검색
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-auto border border-gray-200 rounded-lg divide-y">
              {searchResults.slice(0, 5).map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="w-full p-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{place.place_name}</p>
                  <p className="text-xs text-gray-500 truncate">{place.road_address_name || place.address_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <Map
            center={center}
            level={level}
            style={{ width: '100%', height: '100%' }}
            onClick={handleMapClick}
            onCenterChanged={(map) => setCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() })}
            onZoomChanged={(map) => setLevel(map.getLevel())}
          >
            {/* 저장된 마커들 */}
            {markers.map((marker) => (
              <CustomOverlayMap
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lng }}
                yAnchor={1.3}
              >
                <button
                  onClick={() => setSelectedMarker(selectedMarker?.id === marker.id ? null : marker)}
                  className="flex flex-col items-center"
                >
                  <div
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      backgroundColor: marker.color,
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45), 0 3px 6px rgba(0, 0, 0, 0.35)'
                    }}
                  >
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <span
                    className="mt-1 px-2 py-0.5 bg-white rounded text-xs font-medium text-gray-800 max-w-[100px] truncate"
                    style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15)' }}
                  >
                    {marker.name}
                  </span>
                </button>
              </CustomOverlayMap>
            ))}

            {/* 선택된 마커 정보 - 마커 상단 위 8px */}
            {selectedMarker && (
              <CustomOverlayMap
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                xAnchor={0.5}
                yAnchor={0}
              >
                {/* 마커 yAnchor 1.3, 높이 64px → 상단이 좌표에서 83px 위 → 여기서 8px 더 위 */}
                <div style={{ transform: 'translateY(calc(-100% - 83px - 8px))' }}>
                  <div className="bg-white rounded-lg shadow-lg p-3 min-w-[150px] max-w-[200px]">
                    <p className="font-medium text-gray-900 text-sm break-words whitespace-pre-wrap">{selectedMarker.name}</p>
                    {selectedMarker.address && (
                      <p className="text-xs text-gray-500 mt-0.5 break-words whitespace-pre-wrap">{selectedMarker.address}</p>
                    )}
                    {selectedMarker.memo && (
                      <p className="text-xs text-gray-600 mt-1 border-t pt-1 break-words whitespace-pre-wrap">{selectedMarker.memo}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => {
                          setEditingMarker(selectedMarker);
                          setSelectedMarker(null);
                        }}
                        className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteMarker(selectedMarker.id)}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </CustomOverlayMap>
            )}
          </Map>

          {/* 추가 모드 안내 */}
          {isAddMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg">
              지도를 클릭해서 장소를 추가하세요
            </div>
          )}

          {/* 추가 버튼 */}
          <button
            onClick={() => setIsAddMode(!isAddMode)}
            className={`absolute bottom-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
              isAddMode ? 'bg-gray-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isAddMode ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>

        {/* 마커 목록 */}
        {markers.length > 0 && (
          <div className="flex-none max-h-32 overflow-auto border-t">
            <div className="p-2 space-y-1">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-none"
                    style={{ backgroundColor: marker.color }}
                  />
                  <button
                    onClick={() => {
                      setCenter({ lat: marker.lat, lng: marker.lng });
                      setSelectedMarker(marker);
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{marker.name}</p>
                    {marker.address && (
                      <p className="text-xs text-gray-500 truncate">{marker.address}</p>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteMarker(marker.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MapBlockEditorInner.displayName = 'MapBlockEditorInner';

export const MapBlockEditor = forwardRef<MapBlockEditorHandle, MapBlockEditorProps>(
  (props, ref) => {
    return <MapBlockEditorInner {...props} ref={ref} />;
  }
);

MapBlockEditor.displayName = 'MapBlockEditor';
