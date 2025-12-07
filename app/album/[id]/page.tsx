'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import { getAlbum, Album } from '@/lib/api/albums';
import { getEntries, Entry, deleteEntry } from '@/lib/api/entries';
import { EntryCarousel } from './components/EntryCarousel';
import { BlockFilter } from './components/BlockFilter';
import { TagFilter } from './components/TagFilter';

export default function AlbumEntriesPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [albumTags, setAlbumTags] = useState<{ tag: string; count: number }[]>([]);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedAlbum, loadedEntries] = await Promise.all([
          getAlbum(albumId),
          getEntries(albumId),
        ]);

        setAlbum(loadedAlbum);
        setEntries(loadedEntries);

        // 태그 목록 추출 (entries에서 직접)
        const tagCounts: Record<string, number> = {};
        loadedEntries.forEach(entry => {
          entry.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        const tags = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
        setAlbumTags(tags);
      } catch (error) {
        console.error('Failed to load album data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [albumId]);

  // 태그로 필터링된 엔트리
  const filteredEntries = useMemo(() => {
    if (selectedTags.length === 0) return entries;
    return entries.filter(entry =>
      entry.tags?.some(tag => selectedTags.includes(tag))
    );
  }, [entries, selectedTags]);

  // 기록 삭제
  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      try {
        await deleteEntry(entryId);
        setEntries(prev => prev.filter(e => e.id !== entryId));
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  // 기록 수정
  const handleEditEntry = (entryId: string) => {
    router.push(`/album/${albumId}/entry?edit=${entryId}`);
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
    <main className="fixed inset-0 flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="flex-none bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{album.name}</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                {selectedTags.length > 0
                  ? `${filteredEntries.length}/${entries.length}개 기록`
                  : `${entries.length}개의 기록`}
              </p>
              {/* 블록 필터 */}
              {album.blocks.length > 0 && entries.length > 0 && (
                <BlockFilter
                  blocks={album.blocks}
                  selectedBlockIds={selectedBlockIds}
                  onSelectionChange={setSelectedBlockIds}
                />
              )}
              {/* 태그 필터 */}
              {albumTags.length > 0 && (
                <TagFilter
                  tags={albumTags}
                  selectedTags={selectedTags}
                  onSelectionChange={setSelectedTags}
                />
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/album/${albumId}/entry`)}
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
          entries={filteredEntries}
          blocks={album.blocks}
          selectedBlockIds={selectedBlockIds}
          albumId={albumId}
          onEntryDelete={handleDeleteEntry}
          onEntryEdit={handleEditEntry}
          isFullscreenMode={isFullscreenMode}
          onToggleFullscreen={() => setIsFullscreenMode(!isFullscreenMode)}
        />
      )}
    </main>
  );
}
