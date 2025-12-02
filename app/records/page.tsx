'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { getAlbums, Album } from '@/lib/storage/album';
import { AlbumCard } from '@/components/AlbumCard';

export default function RecordsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedAlbums = getAlbums();
    setAlbums(loadedAlbums);
    setIsLoading(false);
  }, []);

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
          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black"
        />
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Filter size={20} strokeWidth={2} className="text-gray-400 hover:text-black" />
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full border-2 border-black bg-black text-white text-sm font-medium whitespace-nowrap">
          전체
        </button>
        <button className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-black text-sm font-medium whitespace-nowrap hover:border-black">
          최근 7일
        </button>
        <button className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-black text-sm font-medium whitespace-nowrap hover:border-black">
          이번 달
        </button>
      </div>

      {/* 앨범 목록 */}
      <div className="space-y-3 mb-20">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : albums.length === 0 ? (
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
          albums.map((album) => (
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
