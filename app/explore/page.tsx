import { Search, Filter, Folder } from 'lucide-react';

export default function ExplorePage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">탐색</h1>
        <p className="text-gray-600 dark:text-gray-400">
          모든 기록을 둘러보세요
        </p>
      </header>

      {/* 검색 바 */}
      <div className="relative mb-6">
        <Search
          size={20}
          strokeWidth={2}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="기록 검색..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber"
        />
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Filter size={20} strokeWidth={2} className="text-gray-400" />
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full bg-amber text-white text-sm font-medium whitespace-nowrap">
          전체
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium whitespace-nowrap">
          최근 7일
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium whitespace-nowrap">
          이번 달
        </button>
      </div>

      {/* 빈 상태 */}
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Folder size={48} strokeWidth={1.5} className="text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          아직 기록이 없어요
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          첫 기록을 만들어보세요
        </p>
      </div>
    </main>
  );
}
