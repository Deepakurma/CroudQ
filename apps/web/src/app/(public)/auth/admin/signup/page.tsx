import { redirect } from 'next/navigation';

import AdminSignupForm from '~/components/admin-dashboard/admin-signup-form';
import { getServerAdminUser } from '~/utils/trpc-server';

export default async function AdminSignupPage() {
  try {
    await getServerAdminUser();
  } catch {
    redirect('/auth/admin/login?redirect=/auth/admin/signup');
  }

  return (
    <main className="bg-custom-background text-foreground flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="border-border bg-card w-full max-w-lg space-y-6 rounded-2xl border p-6 sm:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Admin</h1>
          <p className="text-muted-foreground text-sm">
            Only an existing admin can create another admin account.
          </p>
        </div>

        <AdminSignupForm />
      </section>
    </main>
  );
}
