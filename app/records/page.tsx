import { Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';

export default function RecordsPage() {
  return (
    <main className="min-h-screen p-6 bg-white relative">
      {/* 검색 바 */}
      <div className="relative mb-6">
        <Search
          size={20}
          strokeWidth={2}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="앨범 검색..."
          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black"
        />
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Filter size={20} strokeWidth={2} className="text-gray-400 hover:text-black" />
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full border-2 border-black bg-black text-white text-sm font-medium whitespace-nowrap">
          전체
        </button>
        <button className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-black text-sm font-medium whitespace-nowrap hover:border-black">
          최근 7일
        </button>
        <button className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-black text-sm font-medium whitespace-nowrap hover:border-black">
          이번 달
        </button>
      </div>

      {/* 카테고리 카드들 */}
      <div className="space-y-3 mb-20">
        <div className="rounded-xl border-2 border-black p-4 bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          <h3 className="text-lg font-bold text-black mb-1">Personality Quiz</h3>
          <p className="text-sm text-gray-500">3장</p>
        </div>

        <div className="rounded-xl border-2 border-black p-4 bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          <h3 className="text-lg font-bold text-black mb-1">Good Morning</h3>
          <p className="text-sm text-gray-500">12장</p>
        </div>

        <div className="rounded-xl border-2 border-black p-4 bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          <h3 className="text-lg font-bold text-black mb-1">Brainstorming Presents</h3>
          <p className="text-sm text-gray-500">5장</p>
        </div>

        <div className="rounded-xl border-2 border-black p-4 bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          <h3 className="text-lg font-bold text-black mb-1">Brunch Recipe Ideas</h3>
          <p className="text-sm text-gray-500">8장</p>
        </div>
      </div>

      {/* 하단 새 앨범 버튼 */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-colors"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>새 앨범</span>
        </Link>
      </div>
    </main>
  );
}
