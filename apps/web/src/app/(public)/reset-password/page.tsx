'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

import type { FormEvent, ReactNode } from 'react';

const LOGIN_APP_SCHEME = 'croudq://login';

function ResetPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-custom-background text-foreground flex min-h-dvh items-center justify-center px-4 py-8">
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  const handleOpenInApp = () => {
    window.location.assign(LOGIN_APP_SCHEME);
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
      toast.success('Password updated successfully.');
      setIsResetComplete(true);
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
            ? 'Set a new password here in the browser.'
            : 'Enter your email to receive a reset link.'}
        </p>
      </div>

      {isResetFlow ? (
        isResetComplete ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Your password has been reset. You can go back to the app and log in.
            </p>
            <Button type="button" className="w-full" onClick={handleOpenInApp}>
              Open App
            </Button>
          </div>
        ) : (
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
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )
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
