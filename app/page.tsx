import { FileText, TrendingUp, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      {/* 헤더 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">안녕하세요</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘도 기록을 시작해볼까요?
        </p>
      </header>

      {/* 통계 카드 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">이번 주 기록</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber to-amber-dark rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={20} strokeWidth={2} />
              <p className="text-sm opacity-90">총 기록</p>
            </div>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-gradient-to-br from-terracotta to-terracotta-dark rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={20} strokeWidth={2} />
              <p className="text-sm opacity-90">연속 기록</p>
            </div>
            <p className="text-4xl font-bold">0일</p>
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">나의 기록</h2>
          <button className="text-sm text-amber font-medium flex items-center gap-1">
            <span>전체 보기</span>
            <TrendingUp size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FileText size={48} strokeWidth={1.5} className="text-gray-400" />
          </div>
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
