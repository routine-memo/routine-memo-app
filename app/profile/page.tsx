import { User, FileText, FolderOpen, Calendar, Moon, Bell, Database, Info, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  return (
    <main className="min-h-screen p-6 bg-white">
      {/* 프로필 카드 */}
      <section className="mb-8">
        <div className="rounded-xl border-2 border-black p-6 bg-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-black bg-gray-100 flex items-center justify-center">
              <User size={32} strokeWidth={2} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">사용자</h2>
              <p className="text-sm text-gray-600">꾸준히 기록하는 중</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FileText size={16} strokeWidth={2} className="text-black" />
                <p className="text-xs text-gray-600">총 기록</p>
              </div>
              <p className="text-2xl font-bold text-black">0</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FolderOpen size={16} strokeWidth={2} className="text-black" />
                <p className="text-xs text-gray-600">카테고리</p>
              </div>
              <p className="text-2xl font-bold text-black">0</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={16} strokeWidth={2} className="text-black" />
                <p className="text-xs text-gray-600">연속 기록</p>
              </div>
              <p className="text-2xl font-bold text-black">0<span className="text-sm ml-0.5">일</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* 설정 메뉴 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-black pb-2 border-b-1 border-gray-300">설정</h2>
        <div className="space-y-2">
          <button className="w-full px-4 py-4 bg-white rounded-lg border-2 border-gray-300 text-left flex items-center justify-between hover:border-black transition-colors">
            <div className="flex items-center gap-3">
              <Moon size={20} strokeWidth={2} className="text-black" />
              <span className="text-black font-medium">다크모드</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white rounded-lg border-2 border-gray-300 text-left flex items-center justify-between hover:border-black transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={20} strokeWidth={2} className="text-black" />
              <span className="text-black font-medium">알림 설정</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white rounded-lg border-2 border-gray-300 text-left flex items-center justify-between hover:border-black transition-colors">
            <div className="flex items-center gap-3">
              <Database size={20} strokeWidth={2} className="text-black" />
              <span className="text-black font-medium">데이터 백업</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
          <button className="w-full px-4 py-4 bg-white rounded-lg border-2 border-gray-300 text-left flex items-center justify-between hover:border-black transition-colors">
            <div className="flex items-center gap-3">
              <Info size={20} strokeWidth={2} className="text-black" />
              <span className="text-black font-medium">앱 정보</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-gray-400" />
          </button>
        </div>
      </section>
    </main>
  );
}
