export default function ProfilePage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">프로필 👤</h1>
        <p className="text-gray-600 dark:text-gray-400">
          내 정보와 설정을 관리하세요
        </p>
      </header>

      {/* 프로필 카드 */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-amber to-terracotta rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-bold">사용자</h2>
              <p className="text-sm opacity-90">꾸준히 기록하는 중</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs opacity-90">총 기록</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs opacity-90">카테고리</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0일</p>
              <p className="text-xs opacity-90">연속 기록</p>
            </div>
          </div>
        </div>
      </section>

      {/* 설정 메뉴 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">설정</h2>
        <div className="space-y-2">
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between">
            <span>🌙 다크모드</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between">
            <span>🔔 알림 설정</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between">
            <span>📦 데이터 백업</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-xl text-left flex items-center justify-between">
            <span>ℹ️ 앱 정보</span>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </section>
    </main>
  );
}
