'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, FileText, FolderOpen, Calendar, Moon, Sun, LogOut, Bell, BellOff, X, Settings, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useDarkMode } from '@/components/DarkModeProvider';
import { usePush } from '@/components/PushProvider';
import { getAlbums } from '@/lib/api/albums';
import { getEntries, Entry } from '@/lib/api/entries';
import { getDailyEntries, DailyEntry } from '@/lib/api/dailyEntries';

// 연속 기록 일수 계산 (entries와 dailyEntries를 인자로 받음)
function calculateStreak(entries: Entry[], dailyEntries: DailyEntry[]): number {
  // 모든 기록의 날짜 수집 (날짜만 추출)
  const allDates = new Set<string>();

  entries.forEach(entry => {
    const date = new Date(entry.createdAt).toISOString().split('T')[0];
    allDates.add(date);
  });

  dailyEntries.forEach(entry => {
    const date = new Date(entry.createdAt).toISOString().split('T')[0];
    allDates.add(date);
  });

  if (allDates.size === 0) return 0;

  // 날짜 정렬 (최신순)
  const sortedDates = Array.from(allDates).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // 어제 날짜
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 가장 최근 기록이 오늘이나 어제가 아니면 연속 기록 끊김
  const mostRecent = sortedDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  // 연속 일수 계산
  let streak = 1;
  let currentDate = new Date(mostRecent);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    if (sortedDates[i] === prevDateStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isSupported, isSubscribed, subscribe, unsubscribe, permission } = usePush();
  const [stats, setStats] = useState({
    totalRecords: 0,
    categories: 0,
    streak: 0,
  });

  // 알림 토글 핸들러
  const handleNotificationToggle = async () => {
    if (!isSupported) {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    if (isSubscribed) {
      // 구독 해제
      const success = await unsubscribe();
      if (!success) {
        alert('알림 해제에 실패했습니다.');
      }
    } else {
      // 구독
      const success = await subscribe();
      if (!success) {
        if (permission === 'denied') {
          alert('알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.');
        } else {
          alert('알림 설정에 실패했습니다.');
        }
      }
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [albums, entries, dailyEntries] = await Promise.all([
          getAlbums(),
          getEntries(),
          getDailyEntries(),
        ]);

        const totalRecords = entries.length + dailyEntries.length;
        const categories = albums.length + (dailyEntries.length > 0 ? 1 : 0); // 앨범 + 즉석앨범
        const streak = calculateStreak(entries, dailyEntries);

        setStats({ totalRecords, categories, streak });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <main className="min-h-screen p-6 bg-white dark:bg-gray-900 transition-colors">
      {/* 프로필 카드 */}
      <section className="mb-8">
        <div className="rounded-xl border-2 border-black dark:border-gray-600 p-6 bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="프로필 이미지"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full border-2 border-black dark:border-gray-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-black dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-colors">
                <User size={32} strokeWidth={2} className="text-black dark:text-white" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                {session?.user?.name || '사용자'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session?.user?.email || '꾸준히 기록하는 중'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black dark:border-gray-600 transition-colors">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FileText size={16} strokeWidth={2} className="text-black dark:text-white" />
                <p className="text-xs text-gray-600 dark:text-gray-400">총 기록</p>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.totalRecords}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FolderOpen size={16} strokeWidth={2} className="text-black dark:text-white" />
                <p className="text-xs text-gray-600 dark:text-gray-400">카테고리</p>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.categories}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={16} strokeWidth={2} className="text-black dark:text-white" />
                <p className="text-xs text-gray-600 dark:text-gray-400">연속 기록</p>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.streak}<span className="text-sm ml-0.5">일</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* 계정 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white pb-2 border-b-1 border-gray-300 dark:border-gray-700">계정</h2>
        <div className="space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:border-red-500 dark:hover:border-red-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} strokeWidth={2} className="text-red-500 dark:text-red-400" />
              <span className="text-red-500 dark:text-red-400 font-medium">로그아웃</span>
            </div>
          </button>
        </div>
      </section>

      {/* 설정 메뉴 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white pb-2 border-b-1 border-gray-300 dark:border-gray-700">설정</h2>
        <div className="space-y-2">
          {/* 알림 설정 */}
          <button
            onClick={handleNotificationToggle}
            disabled={!isSupported}
            className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:border-black dark:hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell size={20} strokeWidth={2} className="text-amber-500" />
              ) : (
                <BellOff size={20} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
              )}
              <div>
                <span className="text-black dark:text-white font-medium block">
                  푸시 알림
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {!isSupported ? '지원되지 않는 브라우저' : isSubscribed ? '알림 활성화됨' : '알림 비활성화'}
                </span>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${isSubscribed ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${isSubscribed ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* 다크모드 설정 */}
          <button
            onClick={toggleDarkMode}
            className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:border-black dark:hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Sun size={20} strokeWidth={2} className="text-black dark:text-white" />
              ) : (
                <Moon size={20} strokeWidth={2} className="text-black dark:text-white" />
              )}
              <span className="text-black dark:text-white font-medium">
                {isDarkMode ? '라이트모드' : '다크모드'}
              </span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      </section>
    </main>
  );
}
