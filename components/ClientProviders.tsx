'use client';

import { MediaMigrationProvider } from './MediaMigrationProvider';
import { DarkModeProvider } from './DarkModeProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <DarkModeProvider>
      <MediaMigrationProvider>
        {children}
      </MediaMigrationProvider>
    </DarkModeProvider>
  );
}
