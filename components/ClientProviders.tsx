'use client';

import { SessionProvider } from 'next-auth/react';
import { MediaMigrationProvider } from './MediaMigrationProvider';
import { DarkModeProvider } from './DarkModeProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <DarkModeProvider>
        <MediaMigrationProvider>
          {children}
        </MediaMigrationProvider>
      </DarkModeProvider>
    </SessionProvider>
  );
}
