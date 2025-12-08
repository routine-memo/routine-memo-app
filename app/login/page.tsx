'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { Download } from 'lucide-react';

// PWA 설치 프롬프트 타입
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 설치 프롬프트 이벤트 저장
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Routine Memo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            나만의 기록을 시작하세요
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-black dark:border-gray-600 p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
            로그인
          </h2>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-gray-400 transition-colors"
          >
            {/* Google 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">
              Google로 계속하기
            </span>
          </button>

          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
            로그인하면 서비스 이용약관에 동의하게 됩니다
          </p>
        </div>

        {/* 앱 설치 버튼 */}
        {installPrompt && !isInstalled && (
          <button
            onClick={handleInstall}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors"
          >
            <Download size={18} />
            <span className="font-medium">앱으로 설치하기</span>
          </button>
        )}

        {isInstalled && (
          <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">
            앱이 설치되었습니다
          </p>
        )}

        {/* 하단 문구 */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          기록하고, 돌아보고, 성장하세요
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
