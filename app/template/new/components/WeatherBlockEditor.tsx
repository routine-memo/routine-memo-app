'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { WeatherBlockDefault, WeatherType } from '../types';

// 날씨 데이터 정의
const WEATHER_OPTIONS: { type: WeatherType; emoji: string; label: string }[] = [
  { type: 'sunny', emoji: '☀️', label: '맑음' },
  { type: 'cloudy', emoji: '☁️', label: '흐림' },
  { type: 'rainy', emoji: '🌧️', label: '비' },
  { type: 'snowy', emoji: '❄️', label: '눈' },
  { type: 'foggy', emoji: '🌫️', label: '안개' },
  { type: 'typhoon', emoji: '🌀', label: '태풍' },
  { type: 'dusty', emoji: '😷', label: '황사' },
  { type: 'cold', emoji: '🥶', label: '한파' },
  { type: 'hot', emoji: '🥵', label: '폭염' },
];

interface WeatherBlockEditorProps {
  initialValue?: WeatherBlockDefault;
  onChange: (value: WeatherBlockDefault) => void;
  onClose?: () => void;  // 선택 후 창 닫기
}

export interface WeatherBlockEditorHandle {
  save: () => Promise<void>;
}

const WeatherBlockEditorInner = forwardRef<WeatherBlockEditorHandle, WeatherBlockEditorProps>(
  ({ initialValue, onChange, onClose }, ref) => {
    const [selectedWeather, setSelectedWeather] = useState<WeatherType | null>(
      initialValue?.weather || null
    );

    // 날씨 선택 핸들러
    const handleSelect = useCallback((weather: WeatherType) => {
      const newValue = selectedWeather === weather ? null : weather;
      setSelectedWeather(newValue);
      onChange({ weather: newValue });
      // 선택하면 창 닫기
      if (newValue && onClose) {
        setTimeout(() => onClose(), 150);
      }
    }, [selectedWeather, onChange, onClose]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ weather: selectedWeather });
    }, [selectedWeather, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    return (
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-600">날씨 선택</span>
          {selectedWeather && (
            <span className="text-xs text-gray-400">
              (선택됨: {WEATHER_OPTIONS.find(w => w.type === selectedWeather)?.label})
            </span>
          )}
        </div>

        {/* 날씨 선택 그리드 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {WEATHER_OPTIONS.map((weather) => (
              <button
                key={weather.type}
                type="button"
                onClick={() => handleSelect(weather.type)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl
                  transition-all duration-200 border-2
                  ${selectedWeather === weather.type
                    ? 'border-amber-400 bg-amber-50 shadow-md scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-3xl mb-1">{weather.emoji}</span>
                <span className={`text-xs ${selectedWeather === weather.type ? 'text-amber-700 font-medium' : 'text-gray-600'}`}>
                  {weather.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

WeatherBlockEditorInner.displayName = 'WeatherBlockEditorInner';

export const WeatherBlockEditor = WeatherBlockEditorInner;

// 날씨 정보 헬퍼 함수 export
export const getWeatherInfo = (weather: WeatherType | null) => {
  if (!weather) return null;
  return WEATHER_OPTIONS.find(w => w.type === weather) || null;
};

export { WEATHER_OPTIONS };
