'use client';

import { useState, useEffect } from 'react';
import { User, FileText, FolderOpen, Calendar, Moon, Sun, Bell, Database, Info, ChevronRight } from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';
import { getAlbums } from '@/lib/storage/album';
import { getEntries } from '@/lib/storage/entry';
import { getDailyEntries } from '@/lib/storage/dailyEntry';

// 연속 기록 일수 계산
function calculateStreak(): number {
  const entries = getEntries();
  const dailyEntries = getDailyEntries();

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
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [stats, setStats] = useState({
    totalRecords: 0,
    categories: 0,
    streak: 0,
  });

  useEffect(() => {
    // 통계 계산
    const albums = getAlbums();
    const entries = getEntries();
    const dailyEntries = getDailyEntries();

    const totalRecords = entries.length + dailyEntries.length;
    const categories = albums.length + (dailyEntries.length > 0 ? 1 : 0); // 앨범 + 즉석앨범
    const streak = calculateStreak();

    setStats({ totalRecords, categories, streak });
  }, []);

  return (
    <main className="min-h-screen p-6 bg-white dark:bg-gray-900 transition-colors">
      {/* 프로필 카드 */}
      <section className="mb-8">
        <div className="rounded-xl border-2 border-black dark:border-gray-600 p-6 bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-black dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-colors">
              <User size={32} strokeWidth={2} className="text-black dark:text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">사용자</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">꾸준히 기록하는 중</p>
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

      {/* 설정 메뉴 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white pb-2 border-b-1 border-gray-300 dark:border-gray-700">설정</h2>
        <div className="space-y-2">
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
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:border-black dark:hover:border-gray-400 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={20} strokeWidth={2} className="text-black dark:text-white" />
              <span className="text-black dark:text-white font-medium">알림 설정</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:border-black dark:hover:border-gray-400 transition-colors">
            <div className="flex items-center gap-3">
              <Database size={20} strokeWidth={2} className="text-black dark:text-white" />
              <span className="text-black dark:text-white font-medium">데이터 백업</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:border-black dark:hover:border-gray-400 transition-colors">
            <div className="flex items-center gap-3">
              <Info size={20} strokeWidth={2} className="text-black dark:text-white" />
              <span className="text-black dark:text-white font-medium">앱 정보</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
        </div>
      </section>
    </main>
  );
}
