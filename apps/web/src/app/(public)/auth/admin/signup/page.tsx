'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

import type { FormEvent } from 'react';

export default function AdminSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      try {
        await trpcClient.adminAuth.me.query();
        if (mounted) setIsAllowed(true);
      } catch {
        try {
          await trpcClient.adminAuth.refreshSession.mutate();
          await trpcClient.adminAuth.me.query();
          if (mounted) setIsAllowed(true);
        } catch {
          router.replace('/auth/admin/login?redirect=/auth/admin/signup');
        }
      }
    };

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await trpcClient.adminAuth.createAdmin.mutate({
        name: name.trim() || undefined,
        email,
        password
      });

      toast.success('New admin created successfully.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Unable to create admin.';
      toast.error(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAllowed) {
    return (
      <main className="bg-background text-muted-foreground flex min-h-dvh items-center justify-center px-4 text-center text-sm font-medium">
        Checking admin access...
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="border-border bg-card w-full max-w-lg space-y-6 rounded-2xl border p-6 sm:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Admin</h1>
          <p className="text-muted-foreground text-sm">
            Only an existing admin can create another admin account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin name"
            />
          </div>

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

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Admin'}
          </Button>
        </form>
      </section>
    </main>
  );
}
