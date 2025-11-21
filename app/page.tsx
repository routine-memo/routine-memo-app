export default function Home() {
  return (
    <main className="min-h-screen p-6">
      {/* 헤더 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">안녕하세요 👋</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘도 기록을 시작해볼까요?
        </p>
      </header>

      {/* 통계 카드 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">이번 주 기록</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber to-amber-dark rounded-2xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">총 기록</p>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-gradient-to-br from-terracotta to-terracotta-dark rounded-2xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">연속 기록</p>
            <p className="text-4xl font-bold">0일</p>
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">나의 기록</h2>
          <button className="text-sm text-amber font-medium">전체 보기</button>
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-16">
          <p className="text-6xl mb-4">📝</p>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            아직 기록이 없어요
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            하단의 + 버튼을 눌러 첫 기록을 시작해보세요
          </p>
        </div>
      </section>
    </main>
  );
}
