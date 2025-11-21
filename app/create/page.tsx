import Link from 'next/link';
import { FileEdit, Sparkles, Camera, Clock } from 'lucide-react';

export default function CreatePage() {
  return (
    <main className="min-h-screen p-6 bg-white">
      {/* 옵션 선택 */}
      <section className="space-y-4">
        <button className="w-full p-6 rounded-xl border-2 border-black bg-white text-left hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
          <FileEdit size={40} strokeWidth={1.5} className="mb-3 text-black" />
          <h3 className="text-xl font-bold mb-1 text-black">템플릿으로 기록하기</h3>
          <p className="text-sm text-gray-600">
            기존 템플릿을 사용해서 빠르게 기록
          </p>
        </button>

        <Link href="/template/new" className="block w-full p-6 rounded-xl border-2 border-black bg-white text-left hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
          <Sparkles size={40} strokeWidth={1.5} className="mb-3 text-black" />
          <h3 className="text-xl font-bold mb-1 text-black">새 템플릿 만들기</h3>
          <p className="text-sm text-gray-600">
            나만의 새로운 템플릿 생성
          </p>
        </Link>

        <button className="w-full p-6 rounded-xl border-2 border-gray-300 bg-white text-left hover:border-black transition-colors">
          <Camera size={40} strokeWidth={1.5} className="mb-3 text-gray-600" />
          <h3 className="text-xl font-bold mb-1 text-black">빠른 기록</h3>
          <p className="text-sm text-gray-600">
            사진이나 메모로 간단하게 기록
          </p>
        </button>
      </section>

      {/* 최근 템플릿 */}
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b-1 border-gray-300">
          <Clock size={20} strokeWidth={2} className="text-black" />
          <h2 className="text-xl font-semibold text-black">최근 사용한 템플릿</h2>
        </div>
        <div className="text-center py-8 rounded-lg border-2 border-gray-200 bg-gray-50">
          <p className="text-gray-500 text-sm">
            아직 사용한 템플릿이 없어요
          </p>
        </div>
      </section>
    </main>
  );
}
