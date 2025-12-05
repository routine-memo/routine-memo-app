'use client';

import { useEffect, useState } from 'react';
import { migrateMediaToIndexedDB } from '@/lib/storage/entry';

interface MediaMigrationProviderProps {
  children: React.ReactNode;
}

export function MediaMigrationProvider({ children }: MediaMigrationProviderProps) {
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const runMigration = async () => {
      setIsMigrating(true);
      try {
        const result = await migrateMediaToIndexedDB();
        if (result.migrated > 0) {
          console.log(`미디어 마이그레이션 완료: ${result.migrated}개 성공, ${result.failed}개 실패`);
        }
      } catch (e) {
        console.error('마이그레이션 오류:', e);
      } finally {
        setIsMigrating(false);
      }
    };

    runMigration();
  }, []);

  if (isMigrating) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">데이터 최적화 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
