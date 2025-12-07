'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import { DailyEntry, getDailyEntries, deleteDailyEntry } from '@/lib/api/dailyEntries';
import { Entry } from '@/lib/api/entries';
import { EntryCarousel } from '@/app/album/[id]/components/EntryCarousel';
import { TagFilter } from '@/app/album/[id]/components/TagFilter';

// DailyEntry를 Entry 호환 형식으로 변환
function convertToEntryFormat(dailyEntry: DailyEntry): Entry & { blocks: typeof dailyEntry.blocks } {
  return {
    id: dailyEntry.id,
    userId: dailyEntry.userId,
    albumId: 'daily', // placeholder
    createdAt: dailyEntry.createdAt,
    updatedAt: dailyEntry.updatedAt,
    blockValues: dailyEntry.blockValues,
    tags: dailyEntry.tags,
    blocks: dailyEntry.blocks, // 즉석 앨범은 각 엔트리가 자체 blocks를 가짐
  };
}

// 태그 목록 추출 (entries에서 직접)
function extractTags(entries: DailyEntry[]): { tag: string; count: number }[] {
  const tagCounts: Record<string, number> = {};
  entries.forEach(entry => {
    entry.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
}

export default function DailyPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dailyTags, setDailyTags] = useState<{ tag: string; count: number }[]>([]);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedEntries = await getDailyEntries();
        setEntries(loadedEntries);

        const tags = extractTags(loadedEntries);
        setDailyTags(tags);
      } catch (error) {
        console.error('Failed to load daily entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 태그 필터링
  const filteredEntries = useMemo(() => {
    if (selectedTags.length === 0) return entries;
    return entries.filter(entry =>
      entry.tags?.some(tag => selectedTags.includes(tag))
    );
  }, [entries, selectedTags]);

  // Entry 호환 형식으로 변환
  const convertedEntries = useMemo(() =>
    filteredEntries.map(convertToEntryFormat),
    [filteredEntries]
  );

  // 기록 삭제
  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      try {
        await deleteDailyEntry(entryId);
        setEntries(prev => prev.filter(e => e.id !== entryId));
      } catch (error) {
        console.error('Failed to delete daily entry:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="flex-none bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">즉석 앨범</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                {selectedTags.length > 0
                  ? `${filteredEntries.length}/${entries.length}개 기록`
                  : `${entries.length}개의 기록`}
              </p>
              {dailyTags.length > 0 && (
                <TagFilter
                  tags={dailyTags}
                  selectedTags={selectedTags}
                  onSelectionChange={setSelectedTags}
                />
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/daily/new')}
            className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 기록 캐러셀 또는 빈 상태 */}
      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-700 mb-2 font-medium">아직 기록이 없어요</p>
            <p className="text-sm text-gray-500 mb-6">
              첫 번째 즉석 앨범을 만들어보세요
            </p>
            <button
              onClick={() => router.push('/daily/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              기록하기
            </button>
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-700 mb-2 font-medium">선택한 태그의 기록이 없어요</p>
            <p className="text-sm text-gray-500 mb-6">
              다른 태그를 선택하거나 필터를 해제해보세요
            </p>
            <button
              onClick={() => setSelectedTags([])}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              필터 해제
            </button>
          </div>
        </div>
      ) : (
        <EntryCarousel
          entries={convertedEntries}
          selectedBlockIds={[]}
          onEntryDelete={handleDeleteEntry}
          isFullscreenMode={isFullscreenMode}
          onToggleFullscreen={() => setIsFullscreenMode(!isFullscreenMode)}
          isDailyAlbum={true}
        />
      )}
    </main>
  );
}
