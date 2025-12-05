'use client';

import { MediaMigrationProvider } from './MediaMigrationProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <MediaMigrationProvider>
      {children}
    </MediaMigrationProvider>
  );
}
