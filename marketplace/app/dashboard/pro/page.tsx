import { redirect } from 'next/navigation';

export default function ProDashboardFallback() {
  redirect('/en/dashboard/pro');
}

