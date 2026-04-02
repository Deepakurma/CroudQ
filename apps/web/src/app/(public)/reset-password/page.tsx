'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

import type { FormEvent, ReactNode } from 'react';

const APP_SCHEME = 'croudq://reset-password';

function ResetPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="border-border bg-card w-full max-w-md space-y-6 rounded-2xl border p-6 sm:p-8">
        {children}
      </section>
    </main>
  );
}

function PasswordResetPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isResetFlow = Boolean(token);
  const deepLink = useMemo(() => {
    if (!token) {
      return null;
    }

    return `${APP_SCHEME}?token=${encodeURIComponent(token)}`;
  }, [token]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!deepLink || typeof window === 'undefined') {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileBrowser = /android|iphone|ipad|ipod/.test(userAgent);
    if (!isMobileBrowser) {
      return;
    }

    const sessionKey = `password-reset-app-open:${token}`;
    if (window.sessionStorage.getItem(sessionKey) === '1') {
      return;
    }

    window.sessionStorage.setItem(sessionKey, '1');
    const timeoutId = window.setTimeout(() => {
      window.location.assign(deepLink);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deepLink, token]);

  const handleOpenInApp = () => {
    if (!deepLink) {
      return;
    }

    window.location.assign(deepLink);
  };

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await trpcClient.auth.requestPasswordReset.mutate({
        email,
        redirectTo: `${window.location.origin}/reset-password`
      });

      toast.success('If an account exists, a reset link has been sent.');
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Unable to send reset link.';
      toast.error(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error('Reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await trpcClient.auth.resetPassword.mutate({
        token,
        password
      });
      toast.success('Password updated successfully. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Unable to reset password.';
      toast.error(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResetPageShell>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {isResetFlow ? 'Set New Password' : 'Reset Password'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isResetFlow
            ? 'Open the app or set a new password here in the browser.'
            : 'Enter your email to receive a reset link.'}
        </p>
      </div>

      {isResetFlow ? (
        <>
          <Button type="button" className="w-full" variant="outline" onClick={handleOpenInApp}>
            Open In App
          </Button>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password In Browser'}
            </Button>
          </form>
        </>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      )}
    </ResetPageShell>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<ResetPageShell>Loading...</ResetPageShell>}>
      <PasswordResetPageContent />
    </Suspense>
  );
}
