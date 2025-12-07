'use client';

import { useState, useRef } from 'react';
import { Plus, Settings, ChevronRight, Pencil, Check, X, Clock, Trash2, Bell, BellOff } from 'lucide-react';
import { Album, AlbumNotification, updateAlbum, deleteAlbum } from '@/lib/storage/album';
import { BlockPosition, BlockDefaultValue } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { BlockValue } from '@/lib/storage/entry';

// 블록 프리뷰 컴포넌트들
import { ProgressBlockPreview } from '@/app/template/new/components/ProgressBlockPreview';
import { DateBlockPreview } from '@/app/template/new/components/DateBlockPreview';
import { TimelineBlockPreview } from '@/app/template/new/components/TimelineBlockPreview';
import { DataGraphBlockPreview } from '@/app/template/new/components/DataGraphBlockPreview';
import { MapBlockPreview } from '@/app/template/new/components/MapBlockPreview';
import { LinkBlockPreview } from '@/app/template/new/components/LinkBlockPreview';
import { FileBlockPreview } from '@/app/template/new/components/FileBlockPreview';
import { VideoBlockPreview } from '@/app/template/new/components/VideoBlockPreview';

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

              <div className="flex-1 flex justify-center relative z-0">
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
          <div className="flex border-t border-gray-800 relative z-10 bg-gray-900">
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

// 블록에서 선택될 블록 ID를 미리 계산하는 헬퍼 함수
// mediaAlreadyUsed: 이미 이미지/영상이 사용됐으면 true
function getSelectedBlockId(
  blocks: BlockPosition[],
  blockValues?: BlockValue[],
  excludeBlockIds?: Set<string>,
  mediaAlreadyUsed?: boolean
): string | null {
  const getBlockValue = (blockId: string): BlockDefaultValue | undefined => {
    return blockValues?.find(bv => bv.blockId === blockId)?.value;
  };

  // 1. 이미지나 영상 확인 (mediaAlreadyUsed가 아닐 때만)
  if (!mediaAlreadyUsed) {
    for (const block of blocks) {
      const value = getBlockValue(block.id);
      if (block.type === 'image' && value?.type === 'image' && value.value.images?.length > 0) {
        const firstImage = value.value.images.find(img => img);
        if (firstImage) return block.id;
      }
      if (block.type === 'video' && value?.type === 'video' && value.value.videos?.length > 0) {
        const firstVideo = value.value.videos.find(v => v);
        if (firstVideo) return block.id;
      }
    }
  }

  // 2. 비미디어 블록에서 선택 (중복 제외)
  const nonMediaBlocks = blocks.filter(b => b.type !== 'image' && b.type !== 'video');
  if (nonMediaBlocks.length === 0) return null;

  // 가장 왼쪽 위 블록 찾기 (제외된 블록 제외)
  const sortedBlocks = [...nonMediaBlocks].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.colStart - b.colStart;
  });

  // 제외 목록에 없는 첫 번째 블록 찾기
  for (const block of sortedBlocks) {
    if (!excludeBlockIds?.has(block.id)) {
      return block.id;
    }
  }

  // 모두 제외된 경우 첫 번째 블록 반환 (fallback)
  return sortedBlocks[0]?.id || null;
}

// 겹쳐진 카드 형태의 미리보기
function StackedCardsPreview({ blocks, previewEntries }: { blocks: BlockPosition[]; previewEntries?: PreviewEntry[] }) {
  const cards = [0, 1, 2];

  // 사용된 블록 ID 추적 (비미디어 블록만)
  const usedBlockIds = new Set<string>();
  // 미디어가 이미 사용됐는지 추적
  let mediaAlreadyUsed = false;

  // 각 카드별로 선택될 블록 ID 미리 계산
  const cardSelections = cards.map((cardIndex) => {
    const entry = previewEntries?.[cardIndex];
    const currentBlocks = entry?.blocks || blocks;
    const currentValues = entry?.blockValues;

    // 이 카드에서 선택될 블록 ID 계산
    const selectedBlockId = getSelectedBlockId(currentBlocks, currentValues, usedBlockIds, mediaAlreadyUsed);

    // 선택된 블록 타입 확인
    if (selectedBlockId) {
      const selectedBlock = currentBlocks.find(b => b.id === selectedBlockId);
      if (selectedBlock) {
        if (selectedBlock.type === 'image' || selectedBlock.type === 'video') {
          // 미디어 블록이 선택됨 -> 다음 카드에서는 미디어 제외
          mediaAlreadyUsed = true;
        } else {
          // 비미디어 블록 -> usedBlockIds에 추가
          usedBlockIds.add(selectedBlockId);
        }
      }
    }

    return { currentBlocks, currentValues, selectedBlockId };
  });

  return (
    <div className="relative h-24 w-full flex justify-center items-end">
      {cards.map((cardIndex) => {
        const rotation = (cardIndex - 1) * 8;
        const translateX = (cardIndex - 1) * 51;
        const translateY = Math.abs(cardIndex - 1) * 8 + 50;
        const cardZIndex = cardIndex === 1 ? 3 : cardIndex === 0 ? 2 : 1;
        const { currentBlocks, currentValues, selectedBlockId } = cardSelections[cardIndex];

        return (
          <div
            key={cardIndex}
            className="absolute w-[109px] h-[137px] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={{
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
              zIndex: cardZIndex,
            }}
          >
            <PreviewCardContent
              blocks={currentBlocks}
              blockValues={currentValues}
              selectedBlockId={selectedBlockId}
            />
          </div>
        );
      })}
    </div>
  );
}

// 프리뷰 카드 콘텐츠: 미리 계산된 selectedBlockId로 렌더링
function PreviewCardContent({
  blocks,
  blockValues,
  selectedBlockId
}: {
  blocks: BlockPosition[];
  blockValues?: BlockValue[];
  excludeBlockIds?: Set<string>;
  selectedBlockId?: string | null;
}) {
  // 블록 ID로 값 찾기
  const getBlockValue = (blockId: string): BlockDefaultValue | undefined => {
    return blockValues?.find(bv => bv.blockId === blockId)?.value;
  };

  // selectedBlockId가 있으면 해당 블록 렌더링
  if (selectedBlockId) {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (block) {
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

      // 그 외 블록
      const paletteItem = blockPalette.find(p => p.type === block.type);
      const Icon = iconMap[paletteItem?.icon || 'Type'];
      return renderBlockPreview(block.type, value, Icon, block);
    }
  }

  // 블록이 없으면 기본 아이콘
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <span className="text-gray-400 text-xs">빈 기록</span>
    </div>
  );
}

// 블록 타입별 프리뷰 렌더링 - 실제 BlockPreview 컴포넌트 사용
function renderBlockPreview(
  type: string,
  value: BlockDefaultValue | undefined,
  Icon: React.ComponentType<{ className?: string }>,
  block?: BlockPosition
) {
  // 실제 값이 있는 경우 해당 블록 프리뷰 컴포넌트 사용

  // 달성도 블록
  if (type === 'progress') {
    if (value?.type === 'progress') {
      return <ProgressBlockPreview value={value.value} />;
    }
    if (block?.defaultValue?.type === 'progress') {
      return <ProgressBlockPreview value={block.defaultValue.value} />;
    }
    return <ProgressBlockPreview />;
  }

  // 날짜 블록
  if (type === 'date') {
    if (value?.type === 'date') {
      return <DateBlockPreview date={value.value} />;
    }
    if (block?.defaultValue?.type === 'date') {
      return <DateBlockPreview date={block.defaultValue.value} />;
    }
    return <DateBlockPreview date={{ date: null }} />;
  }

  // 타임라인 블록
  if (type === 'timeline') {
    if (value?.type === 'timeline') {
      return <TimelineBlockPreview value={value.value} />;
    }
    if (block?.defaultValue?.type === 'timeline') {
      return <TimelineBlockPreview value={block.defaultValue.value} />;
    }
    return <TimelineBlockPreview />;
  }

  // 데이터 그래프 블록
  if (type === 'dataGraph') {
    if (value?.type === 'dataGraph') {
      return <DataGraphBlockPreview value={value.value} />;
    }
    if (block?.defaultValue?.type === 'dataGraph') {
      return <DataGraphBlockPreview value={block.defaultValue.value} />;
    }
    return <DataGraphBlockPreview />;
  }

  // 지도 블록
  if (type === 'map') {
    if (value?.type === 'map') {
      return <MapBlockPreview value={value.value} />;
    }
    if (block?.defaultValue?.type === 'map') {
      return <MapBlockPreview value={block.defaultValue.value} />;
    }
    return <MapBlockPreview />;
  }

  // 링크 블록
  if (type === 'link') {
    if (value?.type === 'link') {
      return <LinkBlockPreview link={value.value} />;
    }
    if (block?.defaultValue?.type === 'link') {
      return <LinkBlockPreview link={block.defaultValue.value} />;
    }
    return <LinkBlockPreview link={{ links: [] }} />;
  }

  // 파일 블록
  if (type === 'file') {
    if (value?.type === 'file') {
      return <FileBlockPreview file={value.value} />;
    }
    if (block?.defaultValue?.type === 'file') {
      return <FileBlockPreview file={block.defaultValue.value} />;
    }
    return <FileBlockPreview file={{ files: [] }} />;
  }

  // 비디오 블록
  if (type === 'video' && value?.type === 'video' && value.value.videos?.length > 0) {
    return <VideoBlockPreview videos={value.value.videos} />;
  }

  // 텍스트 블록
  if (type === 'text' && value?.type === 'text' && value.value.richText) {
    const textContent = value.value.richText.replace(/<[^>]*>/g, '').trim();
    if (textContent) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-white overflow-hidden rounded-xl">
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
      <div className="w-full h-full flex items-center justify-center bg-white rounded-xl">
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
      <div className="w-full h-full flex items-center justify-center bg-white rounded-xl">
        <span className="text-2xl">{emotionEmoji[value.value.emotion] || '😐'}</span>
      </div>
    );
  }

  // 체크리스트 블록
  if (type === 'checklist' && value?.type === 'checklist' && value.value.html) {
    const checkedCount = (value.value.html.match(/checked="true"/g) || []).length;
    const totalCount = (value.value.html.match(/<li/g) || []).length;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl">
        <span className="text-lg font-bold text-gray-900">{checkedCount}/{totalCount}</span>
        <span className="text-[7px] text-gray-500">완료</span>
      </div>
    );
  }

  // customLabel이 있으면 표시
  if (block?.customLabel) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl">
        <Icon className="w-5 h-5 text-gray-400" />
        <span className="text-[6px] text-gray-500 text-center px-1 truncate w-full mt-0.5">{block.customLabel}</span>
      </div>
    );
  }

  // 기본: 아이콘 표시
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <Icon className="w-6 h-6 text-gray-300" />
    </div>
  );
}

export default AlbumCard;
