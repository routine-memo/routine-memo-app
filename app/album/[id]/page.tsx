'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Calendar, ChevronRight } from 'lucide-react';
import { getAlbum, Album } from '@/lib/storage/album';
import { getEntriesByAlbum, Entry, deleteEntry } from '@/lib/storage/entry';
import { BlockPosition, BlockDefaultValue } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { getWeatherInfo } from '@/app/template/new/components/WeatherBlockEditor';
import { getEmotionInfo } from '@/app/template/new/components/EmotionBlockEditor';

export default function AlbumEntriesPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedAlbum = getAlbum(albumId);
    if (loadedAlbum) {
      setAlbum(loadedAlbum);
      const loadedEntries = getEntriesByAlbum(albumId);
      setEntries(loadedEntries);
    }
    setIsLoading(false);
  }, [albumId]);

  // 기록 삭제
  const handleDeleteEntry = (entryId: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      deleteEntry(entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  if (!album) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-700 mb-4">앨범을 찾을 수 없습니다</p>
          <button
            onClick={() => router.push('/records')}
            className="text-gray-900 underline"
          >
            앨범 목록으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{album.name}</h1>
            <p className="text-sm text-gray-500">{entries.length}개의 기록</p>
          </div>
          <button
            onClick={() => router.push(`/album/${albumId}/entry`)}
            className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="p-4">
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-700 mb-2 font-medium">아직 기록이 없어요</p>
            <p className="text-sm text-gray-500 mb-6">
              첫 번째 기록을 추가해보세요
            </p>
            <button
              onClick={() => router.push(`/album/${albumId}/entry`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              기록하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                blocks={album.blocks}
                onDelete={() => handleDeleteEntry(entry.id)}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// 기록 카드 컴포넌트
interface EntryCardProps {
  entry: Entry;
  blocks: BlockPosition[];
  onDelete: () => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}

function EntryCard({ entry, blocks, onDelete, formatDate, formatTime }: EntryCardProps) {
  // 블록 값을 맵으로 변환
  const valueMap = new Map(entry.blockValues.map(bv => [bv.blockId, bv.value]));

  // 미리보기에 표시할 주요 정보 추출
  const previewItems = blocks.slice(0, 4).map(block => {
    const value = valueMap.get(block.id);
    if (!value) return null;

    const paletteItem = blockPalette.find(p => p.type === block.type);
    const label = block.customLabel || paletteItem?.label || '';

    return {
      block,
      value,
      label,
    };
  }).filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더: 날짜/시간 */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{formatDate(entry.createdAt)}</p>
          <p className="text-xs text-gray-500">{formatTime(entry.createdAt)}</p>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-600"
        >
          삭제
        </button>
      </div>

      {/* 내용 미리보기 */}
      <div className="p-4">
        {previewItems.length === 0 ? (
          <p className="text-sm text-gray-400">입력된 내용 없음</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {previewItems.map((item) => {
              if (!item) return null;
              return (
                <PreviewItem
                  key={item.block.id}
                  block={item.block}
                  value={item.value}
                  label={item.label}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 미리보기 아이템 컴포넌트
interface PreviewItemProps {
  block: BlockPosition;
  value: BlockDefaultValue;
  label: string;
}

function PreviewItem({ block, value, label }: PreviewItemProps) {
  const paletteItem = blockPalette.find(p => p.type === block.type);
  const Icon = iconMap[paletteItem?.icon || 'Type'];

  // 값을 간략히 표시
  const renderValue = () => {
    switch (value.type) {
      case 'text':
        if (!value.value.richText || value.value.richText === '<p></p>') return null;
        // HTML 태그 제거하고 텍스트만 추출
        const textContent = value.value.richText.replace(/<[^>]*>/g, '').trim();
        return (
          <p className="text-sm text-gray-700 line-clamp-2">{textContent || '텍스트'}</p>
        );

      case 'weather':
        if (!value.value.weather) return null;
        const weatherInfo = getWeatherInfo(value.value.weather);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{weatherInfo?.emoji}</span>
            <span className="text-sm text-gray-700">{weatherInfo?.label}</span>
          </div>
        );

      case 'emotion':
        if (!value.value.emotion) return null;
        const emotionInfo = getEmotionInfo(value.value.emotion);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{emotionInfo?.emoji}</span>
            <span className="text-sm text-gray-700">{emotionInfo?.label}</span>
          </div>
        );

      case 'image':
        if (!value.value.images || value.value.images.length === 0) return null;
        return (
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
              <img
                src={value.value.images[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            {value.value.images.length > 1 && (
              <span className="text-xs text-gray-500">+{value.value.images.length - 1}</span>
            )}
          </div>
        );

      case 'date':
        if (!value.value.date) return null;
        const d = new Date(value.value.date);
        return (
          <p className="text-sm text-gray-700">
            {d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </p>
        );

      case 'dataGraph':
        if (!value.value.values || value.value.values.length === 0) return null;
        return (
          <p className="text-sm text-gray-700">
            {value.value.values.length}개 데이터
          </p>
        );

      case 'checklist':
        if (!value.value.html) return null;
        // 체크된 항목 수 계산
        const checkedCount = (value.value.html.match(/data-checked="true"/g) || []).length;
        const totalCount = (value.value.html.match(/<li/g) || []).length;
        return (
          <p className="text-sm text-gray-700">
            {checkedCount}/{totalCount} 완료
          </p>
        );

      case 'timeline':
        if (!value.value.items || value.value.items.length === 0) return null;
        return (
          <p className="text-sm text-gray-700">
            {value.value.items.length}개 일정
          </p>
        );

      case 'map':
        if (!value.value.markers || value.value.markers.length === 0) return null;
        return (
          <p className="text-sm text-gray-700">
            {value.value.markers.length}개 장소
          </p>
        );

      case 'progress':
        if (value.value.mode === 'percent' && value.value.currentValue !== undefined) {
          const percent = value.value.targetValue
            ? Math.round((value.value.currentValue / value.value.targetValue) * 100)
            : 0;
          return <p className="text-sm text-gray-700">{percent}% 달성</p>;
        }
        return null;

      default:
        return null;
    }
  };

  const content = renderValue();
  if (!content) return null;

  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-none mt-0.5">
        <Icon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
        {content}
      </div>
    </div>
  );
}
