'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, FileText, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getAlbums, Album } from '@/lib/storage/album';
import { AlbumCard } from '@/components/AlbumCard';
import { getDailyEntries, DailyEntry, loadDailyEntryWithMedia } from '@/lib/storage/dailyEntry';
import { getEntries, Entry, loadEntryWithMedia } from '@/lib/storage/entry';
import { BlockPosition } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';

type FilterType = 'all' | 'week' | 'month';

// 즉석 앨범용 미리보기 엔트리 타입
interface DailyPreviewEntry {
  blocks: BlockPosition[];
  blockValues: { blockId: string; value: import('@/app/template/new/types').BlockDefaultValue }[];
}

// 겹쳐진 카드 형태의 미리보기 (밝은 버전 - 카드는 어두운 색)
function DailyStackedCardsPreview({ previewEntries }: { previewEntries: DailyPreviewEntry[] }) {
  const cards = [0, 1, 2];

  return (
    <div className="relative h-24 w-full flex justify-center items-end">
      {cards.map((cardIndex) => {
        const rotation = (cardIndex - 1) * 6;
        const translateX = (cardIndex - 1) * 34;
        const translateY = Math.abs(cardIndex - 1) * 5 - 10;
        // zIndex를 낮춰서 기록하기 버튼보다 뒤에 표시
        const zIndex = cardIndex === 1 ? 3 : cardIndex === 0 ? 2 : 1;
        const entry = previewEntries[cardIndex];

        return (
          <div
            key={cardIndex}
            className="absolute w-[77px] h-24 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
            style={{
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
              zIndex,
            }}
          >
            <DailyPreviewCardContent
              blocks={entry?.blocks || []}
              blockValues={entry?.blockValues}
            />
          </div>
        );
      })}
    </div>
  );
}

// 즉석 앨범 프리뷰 카드 콘텐츠: 이미지/영상 우선, 없으면 가장 왼쪽 위 블록 내용
function DailyPreviewCardContent({
  blocks,
  blockValues,
}: {
  blocks: BlockPosition[];
  blockValues?: { blockId: string; value: import('@/app/template/new/types').BlockDefaultValue }[];
}) {
  // 블록 ID로 값 찾기
  const getBlockValue = (blockId: string) => {
    return blockValues?.find(bv => bv.blockId === blockId)?.value;
  };

  if (blocks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-700">
        <Calendar className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

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
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-700">
        <span className="text-gray-500 text-xs">빈 기록</span>
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

  // 블록 타입별 렌더링 (다크 테마)
  return renderDailyBlockPreview(topLeftBlock.type, value, Icon);
}

// 즉석 앨범 블록 타입별 프리뷰 렌더링 (다크 테마)
function renderDailyBlockPreview(
  type: string,
  value: import('@/app/template/new/types').BlockDefaultValue | undefined,
  Icon: React.ComponentType<{ className?: string }>
) {
  // 텍스트 블록
  if (type === 'text' && value?.type === 'text' && value.value.richText) {
    const textContent = value.value.richText.replace(/<[^>]*>/g, '').trim();
    if (textContent) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gray-700 overflow-hidden">
          <span className="text-[8px] leading-tight text-gray-300 text-center line-clamp-4">
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
      <div className="w-full h-full flex items-center justify-center bg-gray-700">
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
      <div className="w-full h-full flex items-center justify-center bg-gray-700">
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-[8px] text-gray-400">{month}월</span>
        <span className="text-lg font-bold text-gray-200">{day}</span>
      </div>
    );
  }

  // 체크리스트 블록
  if (type === 'checklist' && value?.type === 'checklist' && value.value.html) {
    const checkedCount = (value.value.html.match(/checked="true"/g) || []).length;
    const totalCount = (value.value.html.match(/<li/g) || []).length;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-lg font-bold text-green-400">{checkedCount}/{totalCount}</span>
        <span className="text-[7px] text-green-300">완료</span>
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
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
          <span className="text-lg font-bold text-purple-400">{displayText}</span>
          <span className="text-[6px] text-purple-300 text-center px-1 truncate w-full">{title}</span>
        </div>
      );
    } else if (mode === 'percent' && targetValue) {
      const percent = Math.round(((currentValue || 0) / targetValue) * 100);
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
          <span className="text-lg font-bold text-purple-400">{percent}%</span>
          <span className="text-[6px] text-purple-300 text-center px-1 truncate w-full">{title}</span>
        </div>
      );
    }
  }

  // 타임라인 블록
  if (type === 'timeline' && value?.type === 'timeline' && value.value.items?.length > 0) {
    const itemCount = value.value.items.length;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-lg font-bold text-indigo-400">{itemCount}</span>
        <span className="text-[7px] text-indigo-300">일정</span>
      </div>
    );
  }

  // 데이터 그래프 블록
  if (type === 'dataGraph' && value?.type === 'dataGraph' && value.value.values?.length > 0) {
    const firstValue = value.value.values[0];
    const field = value.value.fields?.find(f => f.id === firstValue.fieldId);
    const displayValue = field?.format === 'percent' ? `${firstValue.value}%` : firstValue.value;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-lg font-bold text-cyan-400">{displayValue}</span>
        <span className="text-[6px] text-cyan-300 text-center px-1 truncate w-full">{field?.name || '데이터'}</span>
      </div>
    );
  }

  // 지도 블록
  if (type === 'map' && value?.type === 'map' && value.value.markers?.length > 0) {
    const markerCount = value.value.markers.length;
    const firstName = value.value.markers[0].name;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-lg">📍</span>
        <span className="text-[7px] text-emerald-300 text-center px-1 truncate w-full">
          {markerCount > 1 ? `${firstName} 외 ${markerCount - 1}` : firstName}
        </span>
      </div>
    );
  }

  // 링크 블록
  if (type === 'link' && value?.type === 'link' && value.value.links?.length > 0) {
    const firstLink = value.value.links[0];
    let title = '';
    try {
      title = firstLink.metadata?.title || new URL(firstLink.url).hostname;
    } catch {
      title = firstLink.url;
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-lg">🔗</span>
        <span className="text-[6px] text-blue-300 text-center px-1 truncate w-full">{title}</span>
      </div>
    );
  }

  // 파일 블록
  if (type === 'file' && value?.type === 'file' && value.value.files?.length > 0) {
    const fileCount = value.value.files.length;
    const firstName = value.value.files[0].name;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
        <span className="text-lg">📎</span>
        <span className="text-[6px] text-orange-300 text-center px-1 truncate w-full">
          {fileCount > 1 ? `${fileCount}개 파일` : firstName}
        </span>
      </div>
    );
  }

  // 기본: 아이콘 표시
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-700">
      <Icon className="w-6 h-6 text-gray-500" />
    </div>
  );
}

export default function RecordsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [dailyPreviewEntries, setDailyPreviewEntries] = useState<DailyPreviewEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const loadedAlbums = getAlbums();
      setAlbums(loadedAlbums);

      const entries = getEntries();
      setAllEntries(entries);

      const daily = getDailyEntries();
      setDailyEntries(daily);

      // 즉석 앨범 미리보기용 엔트리 로드 (최신 3개 기록만)
      const sortedDaily = [...daily].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const previewEntriesRaw = sortedDaily.slice(0, 3);
      const loadedPreviewEntries = await Promise.all(
        previewEntriesRaw.map(entry => loadDailyEntryWithMedia(entry))
      );

      // 즉석 앨범은 각 기록이 자체 blocks를 가짐
      const dailyPreviews: DailyPreviewEntry[] = loadedPreviewEntries.map(entry => ({
        blocks: entry.blocks,
        blockValues: entry.blockValues,
      }));
      setDailyPreviewEntries(dailyPreviews);

      setIsLoading(false);
    };

    loadData();
  }, []);

  // 띄어쓰기 제거 후 검색 (순서는 유지)
  const normalizeForSearch = (text: string) => text.replace(/\s+/g, '').toLowerCase();

  // 미리보기용 기록 데이터 타입
  interface PreviewEntry {
    blocks: BlockPosition[];
    blockValues: { blockId: string; value: import('@/app/template/new/types').BlockDefaultValue }[];
  }

  // 앨범 미리보기 엔트리 (비동기 로드)
  const [albumPreviewEntries, setAlbumPreviewEntries] = useState<Map<string, PreviewEntry[]>>(new Map());

  useEffect(() => {
    const loadAlbumPreviewEntries = async () => {
      const entryMap = new Map<string, PreviewEntry[]>();

      for (const album of albums) {
        // 해당 앨범의 기록들 (최신순)
        const albumEntries = allEntries
          .filter(e => e.albumId === album.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 최대 3개 기록만 로드
        const previewEntriesRaw = albumEntries.slice(0, 3);
        const loadedEntries = await Promise.all(
          previewEntriesRaw.map(entry => loadEntryWithMedia(entry))
        );

        // 일반 앨범은 블록 구조가 앨범에 있음
        const previewEntries: PreviewEntry[] = loadedEntries.map(entry => ({
          blocks: album.blocks,
          blockValues: entry.blockValues,
        }));

        if (previewEntries.length > 0) {
          entryMap.set(album.id, previewEntries);
        }
      }

      setAlbumPreviewEntries(entryMap);
    };

    if (albums.length > 0 && allEntries.length > 0) {
      loadAlbumPreviewEntries();
    }
  }, [albums, allEntries]);

  // 필터에 따른 앨범 필터링 및 정렬
  const sortedAlbums = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 각 앨범의 최신 기록 날짜 계산
    const albumLatestEntry = new Map<string, Date>();
    allEntries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      const current = albumLatestEntry.get(entry.albumId);
      if (!current || entryDate > current) {
        albumLatestEntry.set(entry.albumId, entryDate);
      }
    });

    // 필터링
    let filtered = albums;

    // 검색어 필터링
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeForSearch(searchQuery);
      filtered = filtered.filter(album =>
        normalizeForSearch(album.name).includes(normalizedQuery)
      );
    }

    // 기간 필터링
    if (filter === 'week') {
      filtered = filtered.filter(album => {
        const latestDate = albumLatestEntry.get(album.id);
        return latestDate && latestDate >= sevenDaysAgo;
      });
    } else if (filter === 'month') {
      filtered = filtered.filter(album => {
        const latestDate = albumLatestEntry.get(album.id);
        return latestDate && latestDate >= thisMonthStart;
      });
    }

    // 정렬: 기록 많은 순 → 같으면 최신 업데이트 순
    return [...filtered].sort((a, b) => {
      if (b.pageCount !== a.pageCount) {
        return b.pageCount - a.pageCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [albums, allEntries, filter, searchQuery]);

  // 필터에 따른 즉석 앨범 필터링
  const filteredDailyEntries = useMemo(() => {
    if (filter === 'all') return dailyEntries;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return dailyEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      if (filter === 'week') return entryDate >= sevenDaysAgo;
      if (filter === 'month') return entryDate >= thisMonthStart;
      return true;
    });
  }, [dailyEntries, filter]);

  // 즉석 앨범 표시 여부 (필터 + 검색어에 따라)
  const showDailyAlbum = useMemo(() => {
    // 검색어가 있으면 "즉석 앨범" 이름에 매칭되는지 확인
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeForSearch(searchQuery);
      if (!normalizeForSearch('즉석 앨범').includes(normalizedQuery)) {
        return false;
      }
    }
    return filter === 'all' || filteredDailyEntries.length > 0;
  }, [filter, filteredDailyEntries.length, searchQuery]);

  return (
    <main className="min-h-screen p-6 bg-white relative">
      {/* 검색 바 */}
      <div className="relative mb-6">
        <Search
          size={20}
          strokeWidth={2}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="앨범 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black"
        />
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full border-2 text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-black hover:border-black'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-full border-2 text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'week'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-black hover:border-black'
          }`}
        >
          최근 7일
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded-full border-2 text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'month'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-black hover:border-black'
          }`}
        >
          이번 달
        </button>
      </div>

      {/* 즉석 앨범 카드 (밝은 버전) */}
      {showDailyAlbum && (
        <div className="mb-4 h-[180px]">
          <div className="h-full rounded-2xl bg-white border-2 border-gray-200 overflow-hidden shadow-sm">
            {/* 클릭 가능한 메인 영역 */}
            <div
              onClick={() => router.push('/daily')}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors h-[128px]"
            >
              {/* 앨범 이름 */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  즉석 앨범
                </h3>
              </div>

              {/* 하단 영역 */}
              <div className="flex items-end gap-3">
                <div className="flex flex-col mb-[30px]">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-gray-900 leading-none">
                      {filter === 'all' ? dailyEntries.length : filteredDailyEntries.length}
                    </span>
                    <span className="text-xs text-gray-500 mb-0.5">장</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    <span className="text-[10px] text-gray-500">기록 보기</span>
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </div>
                </div>

                <div className="flex-1 flex justify-center z-0">
                  <DailyStackedCardsPreview previewEntries={dailyPreviewEntries} />
                </div>
              </div>
            </div>

            {/* 액션 버튼 영역 */}
            <div className="border-t border-gray-200 relative z-10 bg-white">
              <button
                onClick={() => router.push('/daily/new')}
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-900 hover:bg-gray-50 transition-colors bg-white"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">기록하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 앨범 목록 */}
      <div className="space-y-3 mb-20">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : sortedAlbums.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
              <FileText size={48} strokeWidth={1.5} className="text-gray-400" />
            </div>
            <p className="text-gray-700 mb-2 font-medium">
              아직 앨범이 없어요
            </p>
            <p className="text-sm text-gray-500">
              아래 버튼을 눌러 첫 앨범을 만들어보세요
            </p>
          </div>
        ) : (
          sortedAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              previewEntries={albumPreviewEntries.get(album.id)}
              onViewEntries={() => router.push(`/album/${album.id}`)}
              onAddEntry={() => router.push(`/album/${album.id}/entry`)}
              onEditAlbum={() => router.push(`/album/${album.id}/edit`)}
              onNameChange={(newName) => {
                setAlbums(prev => prev.map(a =>
                  a.id === album.id ? { ...a, name: newName } : a
                ));
              }}
              onDelete={() => {
                setAlbums(prev => prev.filter(a => a.id !== album.id));
              }}
            />
          ))
        )}
      </div>

      {/* 하단 새 앨범 버튼 */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-colors"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>새 앨범</span>
        </Link>
      </div>
    </main>
  );
}
