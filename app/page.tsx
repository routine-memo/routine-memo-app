'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getAlbums, Album } from '@/lib/storage/album';
import { AlbumCard } from '@/components/AlbumCard';

export default function Home() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedAlbums = getAlbums();
    setAlbums(loadedAlbums);
    setIsLoading(false);
  }, []);

  // 최근 앨범 3개만 표시
  const recentAlbums = albums.slice(0, 3);

  return (
    <main className="min-h-screen p-6 bg-white">
      {/* 통계 카드 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-black">이번 주 앨범</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-black p-6 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={20} strokeWidth={2} className="text-black" />
              <p className="text-sm text-gray-600">총 앨범</p>
            </div>
            <p className="text-4xl font-bold text-black">{albums.length}</p>
          </div>
          <div className="border-2 border-black p-6 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={20} strokeWidth={2} className="text-black" />
              <p className="text-sm text-gray-600">연속 앨범</p>
            </div>
            <p className="text-4xl font-bold text-black">0<span className="text-lg ml-1">일</span></p>
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b-1 border-gray-300">
          <h2 className="text-xl font-semibold text-black">나의 앨범</h2>
          <Link href="/records" className="text-sm text-black font-medium flex items-center gap-1 hover:underline">
            <span>전체 보기</span>
            <ChevronRight size={16} strokeWidth={2} />
          </Link>
        </div>

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
              앨범 탭에서 새 앨범을 만들어보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAlbums.map((album) => (
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
