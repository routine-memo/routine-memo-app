import { User, FileText, FolderOpen, Calendar, Moon, Bell, Database, Info, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">프로필</h1>
        <p className="text-gray-600 dark:text-gray-400">
          내 정보와 설정을 관리하세요
        </p>
      </header>

      {/* 프로필 카드 */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-amber to-terracotta rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User size={32} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold">사용자</h2>
              <p className="text-sm opacity-90">꾸준히 기록하는 중</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FileText size={16} strokeWidth={2} />
                <p className="text-xs opacity-90">총 기록</p>
              </div>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FolderOpen size={16} strokeWidth={2} />
                <p className="text-xs opacity-90">카테고리</p>
              </div>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={16} strokeWidth={2} />
                <p className="text-xs opacity-90">연속 기록</p>
              </div>
              <p className="text-2xl font-bold">0일</p>
            </div>
          </div>
        </div>
      </section>

      {/* 설정 메뉴 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">설정</h2>
        <div className="space-y-2">
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
            <div className="flex items-center gap-3">
              <Moon size={20} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
              <span>다크모드</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
            <div className="flex items-center gap-3">
              <Bell size={20} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
              <span>알림 설정</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
            <div className="flex items-center gap-3">
              <Database size={20} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
              <span>데이터 백업</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
            <div className="flex items-center gap-3">
              <Info size={20} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
              <span>앱 정보</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
        </div>
      </section>
    </main>
  );
}
