'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Calendar, Copy, ArrowLeft } from 'lucide-react';

export default function CreatePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-6 bg-white">
      {/* 헤더 */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* 옵션 선택 */}
      <section className="space-y-4">
        <Link href="/template/new" className="block w-full p-6 rounded-xl border-2 border-black bg-white text-left hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
          <Sparkles size={40} strokeWidth={1.5} className="mb-3 text-black" />
          <h3 className="text-xl font-bold mb-1 text-black">새 앨범 만들기</h3>
          <p className="text-sm text-gray-600">
            나만의 새로운 앨범 생성
          </p>
        </Link>

        <button className="w-full p-6 rounded-xl border-2 border-black bg-white text-left hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
          <Calendar size={40} strokeWidth={1.5} className="mb-3 text-black" />
          <h3 className="text-xl font-bold mb-1 text-black">오늘의 앨범</h3>
          <p className="text-sm text-gray-600">
            즉석에서 만들고 저장하는 일회성 앨범
          </p>
        </button>

        <button className="w-full p-6 rounded-xl border-2 border-black bg-white text-left hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
          <Copy size={40} strokeWidth={1.5} className="mb-3 text-black" />
          <h3 className="text-xl font-bold mb-1 text-black">앨범 복제하기</h3>
          <p className="text-sm text-gray-600">
            기존 앨범을 복제해 새 앨범 만들기
          </p>
        </button>
      </section>
    </main>
  );
}
