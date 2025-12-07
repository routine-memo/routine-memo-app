'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoaded: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const DARK_MODE_KEY = 'routine-memo-dark-mode';

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드 시 저장된 설정 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      setIsDarkMode(saved === 'true');
    }
    setIsLoaded(true);
  }, []);

  // 다크모드 상태 변경 시 DOM 및 localStorage 업데이트
  useEffect(() => {
    if (!isLoaded) return;

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
  }, [isDarkMode, isLoaded]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, isLoaded }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}
