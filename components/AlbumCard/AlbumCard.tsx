'use client';

import { useState, useRef } from 'react';
import { Plus, Settings, ChevronRight, Pencil, Check, X, Clock, Trash2, Bell, BellOff } from 'lucide-react';
import { Album, AlbumNotification, updateAlbum, deleteAlbum } from '@/lib/storage/album';
import { BlockPosition, BlockDefaultValue } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { BlockValue } from '@/lib/storage/entry';

// 미리보기용 기록 데이터
interface PreviewEntry {
  blocks: BlockPosition[];
  blockValues: BlockValue[];
}

interface AlbumCardProps {
  album: Album;
  previewEntries?: PreviewEntry[]; // 최근 기록들 (최대 3개, 블록+값 포함)
  onViewEntries?: () => void;
  onAddEntry?: () => void;
  onEditAlbum?: () => void;
  onNameChange?: (newName: string) => void;
  onDelete?: () => void;
  onNotificationChange?: (notification: AlbumNotification) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function AlbumCard({
  album,
  previewEntries,
  onViewEntries,
  onAddEntry,
  onEditAlbum,
  onNameChange,
  onDelete,
  onNotificationChange,
}: AlbumCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 알림 설정 상태 (로컬)
  const [notification, setNotification] = useState<AlbumNotification>(
    album.notification || { enabled: false, time: '09:00', days: [] }
  );

  // 이름 편집
  const startEditingName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameValue(album.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const finishEditingName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingNameValue.trim() && editingNameValue.trim() !== album.name) {
      updateAlbum(album.id, { name: editingNameValue.trim() });
      onNameChange?.(editingNameValue.trim());
    }
    setIsEditingName(false);
  };

  const cancelEditingName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(false);
  };

  // 카드 뒤집기
  const flipCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  // 알림 설정 변경
  const toggleNotification = () => {
    const newNotification = { ...notification, enabled: !notification.enabled };
    setNotification(newNotification);
    updateAlbum(album.id, { notification: newNotification });
    onNotificationChange?.(newNotification);
  };

  const updateTime = (time: string) => {
    const newNotification = { ...notification, time };
    setNotification(newNotification);
    updateAlbum(album.id, { notification: newNotification });
    onNotificationChange?.(newNotification);
  };

  const toggleDay = (day: number) => {
    const currentDays = notification.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    const newNotification = { ...notification, days: newDays };
    setNotification(newNotification);
    updateAlbum(album.id, { notification: newNotification });
    onNotificationChange?.(newNotification);
  };

  // 삭제
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 앨범을 삭제하시겠습니까? 모든 기록도 함께 삭제됩니다.')) {
      deleteAlbum(album.id);
      onDelete?.();
    }
  };

  return (
    <div
      className="relative h-[250px]"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 앞면 - 메인 카드 */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gray-900 overflow-hidden ${isFlipped ? 'pointer-events-none' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* 오른쪽 위 아이콘들 */}
          <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
            {/* 알림 상태 표시 */}
            {notification.enabled && (
              <div className="p-1.5 text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
            )}
            {/* 알림 설정 버튼 */}
            <button
              onClick={flipCard}
              className="p-1.5 text-gray-500 hover:text-white transition-colors"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>

          {/* 클릭 가능한 메인 영역 */}
          <div
            onClick={onViewEntries}
            className="p-4 cursor-pointer hover:bg-gray-800 transition-colors h-[198px]"
          >
            {/* 앨범 이름 */}
            {isEditingName ? (
              <div
                className="flex items-center gap-2 mb-4"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditingName(e as unknown as React.MouseEvent);
                    if (e.key === 'Escape') cancelEditingName(e as unknown as React.MouseEvent);
                  }}
                  className="flex-1 min-w-0 px-3 py-1.5 text-lg font-bold bg-gray-800 text-white border-2 border-white rounded-lg focus:outline-none"
                  placeholder="앨범 이름"
                />
                <button
                  onClick={finishEditingName}
                  className="flex-none p-1.5 bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEditingName}
                  className="flex-none p-1.5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-white">
                  {album.name}
                </h3>
                <button
                  onClick={startEditingName}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 하단 영역 */}
            <div className="flex items-end gap-4">
              <div className="flex flex-col">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white leading-none">
                    {album.pageCount}
                  </span>
                  <span className="text-xs text-gray-400 mb-1">장</span>
                </div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[10px] text-gray-500">기록 보기</span>
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                {album.blocks.length > 0 ? (
                  <StackedCardsPreview blocks={album.blocks} previewEntries={previewEntries} />
                ) : (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-sm text-gray-500">블록이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 영역 */}
          <div className="flex border-t border-gray-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddEntry?.();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-white hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">기록하기</span>
            </button>
            <div className="w-px bg-gray-800" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditAlbum?.();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">앨범 수정</span>
            </button>
          </div>
        </div>

        {/* 뒷면 - 알림 설정 */}
        <div
          className="absolute inset-0 rounded-2xl bg-gray-900 overflow-hidden p-4 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* 헤더 - 제목 + 토글 + 닫기 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {notification.enabled ? (
                  <Bell className="w-5 h-5 text-amber-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-500" />
                )}
                알림 설정
              </h3>
              {/* 토글 */}
              <button
                onClick={toggleNotification}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notification.enabled ? 'bg-amber-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    notification.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={flipCard}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`flex-1 flex flex-col gap-4 ${!notification.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 시간 선택 */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">알림 시간</label>
              <input
                type="time"
                value={notification.time || '09:00'}
                onChange={(e) => updateTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 요일 선택 */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">반복 요일</label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day, index) => {
                  const isSelected = (notification.days || []).includes(index);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 겹쳐진 카드 형태의 미리보기
function StackedCardsPreview({ blocks, previewEntries }: { blocks: BlockPosition[]; previewEntries?: PreviewEntry[] }) {
  const cards = [0, 1, 2];

  return (
    <div className="relative h-24 w-full flex justify-center items-end">
      {cards.map((cardIndex) => {
        const rotation = (cardIndex - 1) * 8;
        const translateX = (cardIndex - 1) * 30;
        const translateY = Math.abs(cardIndex - 1) * 5;
        const zIndex = cardIndex === 1 ? 3 : cardIndex === 0 ? 2 : 1;
        const entry = previewEntries?.[cardIndex];

        return (
          <div
            key={cardIndex}
            className="absolute w-16 h-20 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={{
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
              zIndex,
            }}
          >
            <PreviewCardContent
              blocks={entry?.blocks || blocks}
              blockValues={entry?.blockValues}
            />
          </div>
        );
      })}
    </div>
  );
}

// 프리뷰 카드 콘텐츠: 이미지/영상 우선, 없으면 가장 왼쪽 위 블록 내용
function PreviewCardContent({ blocks, blockValues }: { blocks: BlockPosition[]; blockValues?: BlockValue[] }) {
  // 블록 ID로 값 찾기
  const getBlockValue = (blockId: string): BlockDefaultValue | undefined => {
    return blockValues?.find(bv => bv.blockId === blockId)?.value;
  };

  // 1. 이미지나 영상이 있는지 먼저 확인
  for (const block of blocks) {
    const value = getBlockValue(block.id);

    // 이미지 블록
    if (block.type === 'image' && value?.type === 'image' && value.value.images?.length > 0) {
      const firstImage = value.value.images.find(img => img);
      if (firstImage) {
        return (
          <img
            src={firstImage}
            alt=""
            className="w-full h-full object-cover"
          />
        );
      }
    }

    // 비디오 블록
    if (block.type === 'video' && value?.type === 'video' && value.value.videos?.length > 0) {
      const firstVideo = value.value.videos.find(v => v);
      if (firstVideo) {
        return (
          <video
            src={firstVideo}
            className="w-full h-full object-cover"
            muted
          />
        );
      }
    }
  }

  // 2. 이미지/영상이 없으면, 가장 왼쪽 위 블록 찾기 (이미지/영상 제외)
  const nonMediaBlocks = blocks.filter(b => b.type !== 'image' && b.type !== 'video');
  if (nonMediaBlocks.length === 0) {
    // 블록이 없으면 기본 아이콘
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-gray-400 text-xs">빈 기록</span>
      </div>
    );
  }

  // 가장 왼쪽 위 블록 찾기 (row 우선, 같으면 colStart)
  const topLeftBlock = nonMediaBlocks.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.colStart - b.colStart;
  })[0];

  const value = getBlockValue(topLeftBlock.id);
  const paletteItem = blockPalette.find(p => p.type === topLeftBlock.type);
  const Icon = iconMap[paletteItem?.icon || 'Type'];

  // 블록 타입별 렌더링
  return renderBlockPreview(topLeftBlock.type, value, Icon);
}

// 블록 타입별 프리뷰 렌더링
function renderBlockPreview(
  type: string,
  value: BlockDefaultValue | undefined,
  Icon: React.ComponentType<{ className?: string }>
) {
  // 텍스트 블록
  if (type === 'text' && value?.type === 'text' && value.value.richText) {
    const textContent = value.value.richText.replace(/<[^>]*>/g, '').trim();
    if (textContent) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gray-50 overflow-hidden">
          <span className="text-[8px] leading-tight text-gray-700 text-center line-clamp-4">
            {textContent.slice(0, 50)}
          </span>
        </div>
      );
    }
  }

  // 날씨 블록
  if (type === 'weather' && value?.type === 'weather' && value.value.weather) {
    const weatherEmoji: Record<string, string> = {
      sunny: '☀️', cloudy: '☁️', rainy: '🌧️', snowy: '❄️', foggy: '🌫️',
      typhoon: '🌀', dusty: '😷', cold: '🥶', hot: '🥵'
    };
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-50">
        <span className="text-2xl">{weatherEmoji[value.value.weather] || '☀️'}</span>
      </div>
    );
  }

  // 감정 블록
  if (type === 'emotion' && value?.type === 'emotion' && value.value.emotion) {
    const emotionEmoji: Record<string, string> = {
      happy: '😊', joyful: '😄', glad: '🙂', interested: '🤔', passionate: '🔥',
      fun: '😆', hopeful: '🌟', comfortable: '😌', excited: '🤩', pleasant: '😇',
      sad: '😢', angry: '😠', surprised: '😮', fearful: '😨', depressed: '😞',
      anxious: '😰', unpleasant: '😣', embarrassed: '😳', regretful: '😔'
    };
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50">
        <span className="text-2xl">{emotionEmoji[value.value.emotion] || '😐'}</span>
      </div>
    );
  }

  // 날짜 블록
  if (type === 'date' && value?.type === 'date' && value.value.date) {
    const date = new Date(value.value.date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
        <span className="text-[8px] text-gray-500">{month}월</span>
        <span className="text-lg font-bold text-gray-800">{day}</span>
      </div>
    );
  }

  // 체크리스트 블록
  if (type === 'checklist' && value?.type === 'checklist' && value.value.html) {
    // 체크된 항목 수 계산
    const checkedCount = (value.value.html.match(/checked="true"/g) || []).length;
    const totalCount = (value.value.html.match(/<li/g) || []).length;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-green-50">
        <span className="text-lg font-bold text-green-700">{checkedCount}/{totalCount}</span>
        <span className="text-[7px] text-green-600">완료</span>
      </div>
    );
  }

  // 달성도 블록
  if (type === 'progress' && value?.type === 'progress') {
    const { mode, title, targetDate, currentValue, targetValue } = value.value;
    if (mode === 'dday' && targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const displayText = diffDays === 0 ? 'D-Day' : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50">
          <span className="text-lg font-bold text-purple-700">{displayText}</span>
          <span className="text-[6px] text-purple-500 text-center px-1 truncate w-full">{title}</span>
        </div>
      );
    } else if (mode === 'percent' && targetValue) {
      const percent = Math.round(((currentValue || 0) / targetValue) * 100);
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50">
          <span className="text-lg font-bold text-purple-700">{percent}%</span>
          <span className="text-[6px] text-purple-500 text-center px-1 truncate w-full">{title}</span>
        </div>
      );
    }
  }

  // 타임라인 블록
  if (type === 'timeline' && value?.type === 'timeline' && value.value.items?.length > 0) {
    const itemCount = value.value.items.length;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
        <span className="text-lg font-bold text-indigo-700">{itemCount}</span>
        <span className="text-[7px] text-indigo-500">일정</span>
      </div>
    );
  }

  // 데이터 그래프 블록
  if (type === 'dataGraph' && value?.type === 'dataGraph' && value.value.values?.length > 0) {
    const firstValue = value.value.values[0];
    const field = value.value.fields?.find(f => f.id === firstValue.fieldId);
    const displayValue = field?.format === 'percent' ? `${firstValue.value}%` : firstValue.value;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-cyan-50">
        <span className="text-lg font-bold text-cyan-700">{displayValue}</span>
        <span className="text-[6px] text-cyan-500 text-center px-1 truncate w-full">{field?.name || '데이터'}</span>
      </div>
    );
  }

  // 지도 블록
  if (type === 'map' && value?.type === 'map' && value.value.markers?.length > 0) {
    const markerCount = value.value.markers.length;
    const firstName = value.value.markers[0].name;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50">
        <span className="text-lg">📍</span>
        <span className="text-[7px] text-emerald-600 text-center px-1 truncate w-full">
          {markerCount > 1 ? `${firstName} 외 ${markerCount - 1}` : firstName}
        </span>
      </div>
    );
  }

  // 링크 블록
  if (type === 'link' && value?.type === 'link' && value.value.links?.length > 0) {
    const firstLink = value.value.links[0];
    const title = firstLink.metadata?.title || new URL(firstLink.url).hostname;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
        <span className="text-lg">🔗</span>
        <span className="text-[6px] text-blue-600 text-center px-1 truncate w-full">{title}</span>
      </div>
    );
  }

  // 파일 블록
  if (type === 'file' && value?.type === 'file' && value.value.files?.length > 0) {
    const fileCount = value.value.files.length;
    const firstName = value.value.files[0].name;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50">
        <span className="text-lg">📎</span>
        <span className="text-[6px] text-orange-600 text-center px-1 truncate w-full">
          {fileCount > 1 ? `${fileCount}개 파일` : firstName}
        </span>
      </div>
    );
  }

  // 기본: 아이콘 표시
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
  );
}

export default AlbumCard;
