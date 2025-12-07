'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Bell, TrendingUp, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getAlbums, Album } from '@/lib/api/albums';
import { getEntries, Entry } from '@/lib/api/entries';
import { AlbumCard } from '@/components/AlbumCard';

// 주의 시작일 가져오기 (월요일 기준)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 주의 끝일 가져오기 (일요일)
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 해빗 트래커 컴포넌트
function HabitTracker({ entries }: { entries: Entry[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 해당 월의 기록 날짜들
  const recordedDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(entry => {
      const dateKey = formatDateKey(new Date(entry.createdAt));
      dates.add(dateKey);
    });
    return dates;
  }, [entries]);

  // 해당 월의 날짜 수 계산
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentMonth]);

  // 월의 첫째 날 요일 (0=일, 1=월, ...)
  const firstDayOfMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentMonth]);

  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 각 날짜의 기록 수 계산
  const getRecordCount = (day: number): number => {
    const dateKey = formatDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    return entries.filter(e => formatDateKey(new Date(e.createdAt)) === dateKey).length;
  };

  // 색상 강도 결정 (기록 수에 따라)
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (count === 1) return 'bg-amber-200 dark:bg-amber-900';
    if (count === 2) return 'bg-amber-300 dark:bg-amber-800';
    if (count === 3) return 'bg-amber-400 dark:bg-amber-700';
    return 'bg-amber-500 dark:bg-amber-600';
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentMonth.getFullYear() && today.getMonth() === currentMonth.getMonth();

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg p-4 transition-colors">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
        </button>
        <h3 className="font-semibold text-black dark:text-white">
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </h3>
        <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <ChevronRight className="w-5 h-5 text-black dark:text-white" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div key={day} className={`text-center text-xs font-medium ${i === 0 ? 'text-red-500 dark:text-red-400' : i === 6 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 빈 칸 (첫째 날 이전) */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* 날짜 */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const count = getRecordCount(day);
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <div
              key={day}
              className={`
                aspect-square rounded-md flex items-center justify-center text-xs font-medium
                ${getColorIntensity(count)}
                ${isToday ? 'ring-2 ring-black dark:ring-white ring-offset-1 dark:ring-offset-gray-800' : ''}
                ${count > 0 ? 'text-amber-900 dark:text-amber-100' : 'text-gray-400 dark:text-gray-500'}
              `}
              title={`${day}일: ${count}개 기록`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>적음</span>
        <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700" />
        <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-900" />
        <div className="w-3 h-3 rounded bg-amber-300 dark:bg-amber-800" />
        <div className="w-3 h-3 rounded bg-amber-400 dark:bg-amber-700" />
        <div className="w-3 h-3 rounded bg-amber-500 dark:bg-amber-600" />
        <span>많음</span>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedAlbums, loadedEntries] = await Promise.all([
          getAlbums(),
          getEntries(),
        ]);
        setAlbums(loadedAlbums);
        setEntries(loadedEntries);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 통계 계산
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);

    // 이번 주 기록 수
    const thisWeekEntries = entries.filter(e => {
      const entryDate = new Date(e.createdAt);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    // 이번 주에 기록한 앨범 ID 목록
    const thisWeekAlbumIds = new Set(thisWeekEntries.map(e => e.albumId));

    // 알림이 설정된 앨범들
    const albumsWithNotification = albums.filter(a => a.notification?.enabled);

    // 총 기록 수
    const totalEntries = entries.length;

    return {
      thisWeekCount: thisWeekEntries.length,
      thisWeekAlbums: albums.filter(a => thisWeekAlbumIds.has(a.id)),
      albumsWithNotification,
      totalEntries,
    };
  }, [albums, entries]);

  // 이번 주에 기록한 앨범들 (최대 3개)
  const thisWeekAlbumsToShow = stats.thisWeekAlbums.slice(0, 3);

  return (
    <main className="min-h-screen p-6 pb-24 bg-white dark:bg-gray-900 transition-colors">
      {/* 통계 카드 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">대시보드</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* 이번 주 기록 */}
          <div className="border-2 border-black dark:border-gray-600 p-4 bg-white dark:bg-gray-800 rounded-lg transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} strokeWidth={2} className="text-black dark:text-white" />
              <p className="text-xs text-gray-600 dark:text-gray-400">이번 주 기록</p>
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">{stats.thisWeekCount}<span className="text-sm ml-1">개</span></p>
          </div>

          {/* 총 기록 */}
          <div className="border-2 border-black dark:border-gray-600 p-4 bg-white dark:bg-gray-800 rounded-lg transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} strokeWidth={2} className="text-black dark:text-white" />
              <p className="text-xs text-gray-600 dark:text-gray-400">총 기록</p>
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">{stats.totalEntries}<span className="text-sm ml-1">개</span></p>
          </div>
        </div>
      </section>

      {/* 해빗 트래커 */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">기록 현황</h2>
        <HabitTracker entries={entries} />
      </section>

      {/* 알림 설정된 앨범 */}
      {stats.albumsWithNotification.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-black dark:text-white flex items-center gap-2">
            <Bell size={18} className="text-amber-500 dark:text-amber-400" />
            알림 설정된 앨범
          </h2>
          <div className="space-y-2">
            {stats.albumsWithNotification.map(album => (
              <div
                key={album.id}
                onClick={() => router.push(`/album/${album.id}`)}
                className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{album.name}</span>
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  {album.notification?.time && `${album.notification.time}`}
                  {album.notification?.days && album.notification.days.length < 7 && (
                    <span className="ml-1">
                      ({album.notification.days.map(d => ['일', '월', '화', '수', '목', '금', '토'][d]).join(', ')})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 이번 주 기록한 앨범 */}
      <section>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-gray-600 dark:text-gray-400" />
            이번 주 기록한 앨범
          </h2>
          <Link href="/records" className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1 hover:underline">
            <span>전체 보기</span>
            <ChevronRight size={16} strokeWidth={2} />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
          </div>
        ) : thisWeekAlbumsToShow.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <Calendar size={36} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              이번 주는 아직 기록이 없어요
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              앨범에서 새 기록을 추가해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {thisWeekAlbumsToShow.map((album) => (
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
