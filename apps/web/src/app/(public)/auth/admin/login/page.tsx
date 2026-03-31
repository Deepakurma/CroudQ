'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

import type { FormEvent, ReactNode } from 'react';

function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="border-border bg-card w-full max-w-md space-y-6 rounded-2xl border p-6 sm:p-8">
        {children}
      </section>
    </main>
  );
}

function AdminLoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('redirect') || '/admin';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await trpcClient.adminAuth.login.mutate({
        email,
        password
      });

      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to login.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
        <p className="text-muted-foreground text-sm">Sign in to access the web admin dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/auth/admin/reset-password"
          className="text-primary font-medium hover:underline">
          Forgot password?
        </Link>
        <Link href="/" className="text-muted-foreground hover:underline">
          Back to site
        </Link>
      </div>
    </AuthPageShell>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AuthPageShell>Loading...</AuthPageShell>}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
