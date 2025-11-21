import { FileEdit, Sparkles, Camera, Clock } from 'lucide-react';

export default function CreatePage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">새 기록</h1>
        <p className="text-gray-600 dark:text-gray-400">
          무엇을 기록하시겠어요?
        </p>
      </header>

      {/* 옵션 선택 */}
      <section className="space-y-4">
        <button className="w-full p-6 bg-gradient-to-br from-amber to-amber-dark rounded-2xl text-white text-left hover:opacity-90 transition">
          <FileEdit size={40} strokeWidth={1.5} className="mb-3" />
          <h3 className="text-xl font-bold mb-1">템플릿으로 기록하기</h3>
          <p className="text-sm opacity-90">
            기존 템플릿을 사용해서 빠르게 기록
          </p>
        </button>

        <button className="w-full p-6 bg-gradient-to-br from-terracotta to-terracotta-dark rounded-2xl text-white text-left hover:opacity-90 transition">
          <Sparkles size={40} strokeWidth={1.5} className="mb-3" />
          <h3 className="text-xl font-bold mb-1">새 템플릿 만들기</h3>
          <p className="text-sm opacity-90">
            나만의 새로운 템플릿 생성
          </p>
        </button>

        <button className="w-full p-6 bg-white dark:bg-gray-800 rounded-2xl text-left border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-amber transition">
          <Camera size={40} strokeWidth={1.5} className="mb-3 text-gray-600 dark:text-gray-400" />
          <h3 className="text-xl font-bold mb-1">빠른 기록</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            사진이나 메모로 간단하게 기록
          </p>
        </button>
      </section>

      {/* 최근 템플릿 */}
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold">최근 사용한 템플릿</h2>
        </div>
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            아직 사용한 템플릿이 없어요
          </p>
        </div>
      </section>
    </main>
  );
}
