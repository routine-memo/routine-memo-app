import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/db/users';
import { RetentionClient } from './RetentionClient';

export default async function RetentionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <RetentionClient />;
}
