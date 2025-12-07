'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EmotionBlockDefault, EmotionType } from '../types';

// 감정 데이터 정의
const POSITIVE_EMOTIONS: { type: EmotionType; emoji: string; label: string }[] = [
  { type: 'happy', emoji: '😊', label: '행복' },
  { type: 'joyful', emoji: '😄', label: '기쁨' },
  { type: 'glad', emoji: '🤗', label: '반가움' },
  { type: 'interested', emoji: '🧐', label: '흥미' },
  { type: 'passionate', emoji: '🔥', label: '열정' },
  { type: 'fun', emoji: '😆', label: '재미' },
  { type: 'hopeful', emoji: '🌟', label: '희망' },
  { type: 'comfortable', emoji: '😌', label: '편안' },
  { type: 'excited', emoji: '🥰', label: '설렘' },
  { type: 'pleasant', emoji: '😁', label: '즐거움' },
];

const NEGATIVE_EMOTIONS: { type: EmotionType; emoji: string; label: string }[] = [
  { type: 'sad', emoji: '😢', label: '슬픔' },
  { type: 'angry', emoji: '😠', label: '분노' },
  { type: 'surprised', emoji: '😲', label: '놀람' },
  { type: 'fearful', emoji: '😨', label: '두려움' },
  { type: 'depressed', emoji: '😞', label: '우울' },
  { type: 'anxious', emoji: '😰', label: '불안' },
  { type: 'unpleasant', emoji: '😒', label: '불쾌' },
  { type: 'embarrassed', emoji: '😳', label: '창피' },
  { type: 'regretful', emoji: '😔', label: '후회' },
];

const ALL_EMOTIONS = [...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS];

interface EmotionBlockEditorProps {
  initialValue?: EmotionBlockDefault;
  onChange: (value: EmotionBlockDefault) => void;
  onClose?: () => void;  // 선택 후 창 닫기
}

export interface EmotionBlockEditorHandle {
  save: () => Promise<void>;
}

const EmotionBlockEditorInner = forwardRef<EmotionBlockEditorHandle, EmotionBlockEditorProps>(
  ({ initialValue, onChange, onClose }, ref) => {
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(
      initialValue?.emotion || null
    );

    // 감정 선택 핸들러
    const handleSelect = useCallback((emotion: EmotionType) => {
      const newValue = selectedEmotion === emotion ? null : emotion;
      setSelectedEmotion(newValue);
      onChange({ emotion: newValue });
      // 선택하면 창 닫기
      if (newValue && onClose) {
        setTimeout(() => onClose(), 150);
      }
    }, [selectedEmotion, onChange, onClose]);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ emotion: selectedEmotion });
    }, [selectedEmotion, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    return (
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-600">감정 선택</span>
          {selectedEmotion && (
            <span className="text-xs text-gray-400">
              (선택됨: {ALL_EMOTIONS.find(e => e.type === selectedEmotion)?.label})
            </span>
          )}
        </div>

        {/* 감정 선택 영역 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* 긍정적 감정 */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              긍정적 감정
            </div>
            <div className="grid grid-cols-5 gap-2">
              {POSITIVE_EMOTIONS.map((emotion) => (
                <button
                  key={emotion.type}
                  type="button"
                  onClick={() => handleSelect(emotion.type)}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-xl
                    transition-all duration-200 border-2
                    ${selectedEmotion === emotion.type
                      ? 'border-green-400 bg-green-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-2xl">{emotion.emoji}</span>
                  <span className={`text-[10px] mt-1 ${selectedEmotion === emotion.type ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {emotion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 부정적 감정 */}
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              부정적 감정
            </div>
            <div className="grid grid-cols-5 gap-2">
              {NEGATIVE_EMOTIONS.map((emotion) => (
                <button
                  key={emotion.type}
                  type="button"
                  onClick={() => handleSelect(emotion.type)}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-xl
                    transition-all duration-200 border-2
                    ${selectedEmotion === emotion.type
                      ? 'border-red-400 bg-red-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-2xl">{emotion.emoji}</span>
                  <span className={`text-[10px] mt-1 ${selectedEmotion === emotion.type ? 'text-red-700 font-medium' : 'text-gray-600'}`}>
                    {emotion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EmotionBlockEditorInner.displayName = 'EmotionBlockEditorInner';

export const EmotionBlockEditor = EmotionBlockEditorInner;

// 감정 정보 헬퍼 함수 export
export const getEmotionInfo = (emotion: EmotionType | null) => {
  if (!emotion) return null;
  return ALL_EMOTIONS.find(e => e.type === emotion) || null;
};

export { POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS, ALL_EMOTIONS };
