'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, FileText, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getAlbums, Album } from '@/lib/storage/album';
import { AlbumCard } from '@/components/AlbumCard';
import { getDailyEntries, DailyEntry } from '@/lib/storage/dailyEntry';
import { getEntries, Entry } from '@/lib/storage/entry';
import { BlockPosition } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';

type FilterType = 'all' | 'week' | 'month';

// 겹쳐진 카드 형태의 미리보기 (밝은 버전 - 카드는 어두운 색)
function StackedCardsPreview({ entries }: { entries: DailyEntry[] }) {
  const cards = [0, 1, 2];
  const blocksPerCard = cards.map(i => entries[i]?.blocks || []);

  return (
    <div className="relative h-16 w-full flex justify-center items-end">
      {cards.map((cardIndex) => {
        const rotation = (cardIndex - 1) * 8;
        const translateX = (cardIndex - 1) * 30;
        const translateY = Math.abs(cardIndex - 1) * 5;
        const zIndex = cardIndex === 1 ? 3 : cardIndex === 0 ? 2 : 1;
        const blocks = blocksPerCard[cardIndex];

        return (
          <div
            key={cardIndex}
            className="absolute w-12 h-14 bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
            style={{
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
              zIndex,
            }}
          >
            <MiniatureAlbumLayout blocks={blocks} />
          </div>
        );
      })}
    </div>
  );
}

// 앨범 전체 레이아웃을 미니어처로 표시
function MiniatureAlbumLayout({ blocks }: { blocks: BlockPosition[] }) {
  const COLS = 6;
  const GAP = 1;

  if (blocks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Calendar className="w-4 h-4 text-gray-600" />
      </div>
    );
  }

  const maxRows = blocks.reduce((max, block) => {
    const blockBottom = block.row + block.height;
    return Math.max(max, blockBottom);
  }, 1);

  return (
    <div
      className="relative w-full h-full p-1"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${Math.max(maxRows, 4)}, 1fr)`,
        gap: `${GAP}px`,
      }}
    >
      {blocks.map((block) => {
        const paletteItem = blockPalette.find(p => p.type === block.type);
        const Icon = iconMap[paletteItem?.icon || 'Type'];

        return (
          <div
            key={block.id}
            className="bg-gray-700 rounded-sm flex items-center justify-center"
            style={{
              gridColumn: `${block.colStart + 1} / span ${block.colSpan}`,
              gridRow: `${block.row + 1} / span ${block.height}`,
            }}
          >
            <Icon className="w-2 h-2 text-gray-400" />
          </div>
        );
      })}
    </div>
  );
}

export default function RecordsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadedAlbums = getAlbums();
    setAlbums(loadedAlbums);

    const entries = getEntries();
    setAllEntries(entries);

    const daily = getDailyEntries();
    setDailyEntries(daily);

    setIsLoading(false);
  }, []);

  // 띄어쓰기 제거 후 검색 (순서는 유지)
  const normalizeForSearch = (text: string) => text.replace(/\s+/g, '').toLowerCase();

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
                <div className="flex flex-col">
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

                <div className="flex-1 flex justify-center">
                  <StackedCardsPreview entries={filter === 'all' ? dailyEntries : filteredDailyEntries} />
                </div>
              </div>
            </div>

            {/* 액션 버튼 영역 */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => router.push('/daily/new')}
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-900 hover:bg-gray-50 transition-colors"
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
