import { FileText, Calendar, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen p-6 bg-white">
      {/* 통계 카드 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-black">이번 주 기록</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-black p-6 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={20} strokeWidth={2} className="text-black" />
              <p className="text-sm text-gray-600">총 기록</p>
            </div>
            <p className="text-4xl font-bold text-black">0</p>
          </div>
          <div className="border-2 border-black p-6 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={20} strokeWidth={2} className="text-black" />
              <p className="text-sm text-gray-600">연속 기록</p>
            </div>
            <p className="text-4xl font-bold text-black">0<span className="text-lg ml-1">일</span></p>
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b-1 border-gray-300">
          <h2 className="text-xl font-semibold text-black">나의 기록</h2>
          <button className="text-sm text-black font-medium flex items-center gap-1 hover:underline">
            <span>전체 보기</span>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
            <FileText size={48} strokeWidth={1.5} className="text-gray-400" />
          </div>
          <p className="text-gray-700 mb-2 font-medium">
            아직 기록이 없어요
          </p>
          <p className="text-sm text-gray-500">
            기록 탭의 + 버튼을 눌러 첫 기록을 시작해보세요
          </p>
        </div>
      </section>
    </main>
  );
}
