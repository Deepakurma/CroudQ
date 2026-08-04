'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '~/shared/shadcn/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '~/shared/shadcn/field';
import { Input } from '~/shared/shadcn/input';

import { trpc } from '~/utils/trpc';

import type { ReactNode } from 'react';

const LOGIN_APP_SCHEME = 'croudq://login';

const requestResetSchema = z.object({
  email: z.email('Please enter a valid email address.')
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
    confirmPassword: z.string()
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  });

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

  const [isResetComplete, setIsResetComplete] = useState(false);

  const requestResetForm = useForm<z.infer<typeof requestResetSchema>>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: ''
    }
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const requestReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => {
        toast.success('If an account exists, a reset link has been sent.');
      },
      onError: (err) => {
        toast.error(err.message);
      }
    })
  );

  const resetPassword = useMutation(
    trpc.auth.resetPassword.mutationOptions({
      onSuccess: () => {
        toast.success('Password updated successfully.');
        setIsResetComplete(true);
        resetPasswordForm.reset();
      },
      onError: (err) => {
        toast.error(err.message);
      }
    })
  );

  const onRequestReset = async (values: z.infer<typeof requestResetSchema>) => {
    await requestReset.mutateAsync(values);
  };

  const onResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      toast.error('Reset token is missing.');
      return;
    }

    await resetPassword.mutateAsync({
      token,
      password: values.password
    });
  };

  return (
    <ResetPageShell>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {isResetFlow ? 'Set New Password' : 'Reset Password'}
        </h1>

        <p className="text-muted-foreground text-sm">
          {isResetFlow
            ? 'Enter your new password below.'
            : 'Enter your email to receive a password reset link.'}
        </p>
      </div>

      {isResetFlow ? (
        isResetComplete ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Your password has been updated successfully.
            </p>

            <Button className="w-full" onClick={() => window.location.assign(LOGIN_APP_SCHEME)}>
              Open App
            </Button>
          </div>
        ) : (
          <form id="reset-password-form" onSubmit={resetPasswordForm.handleSubmit(onResetPassword)}>
            <FieldGroup>
              <Controller
                name="password"
                control={resetPasswordForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">New Password</FieldLabel>

                    <Input
                      {...field}
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={resetPasswordForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>

                    <Input
                      {...field}
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" className="mt-6 w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )
      ) : (
        <form id="request-reset-form" onSubmit={requestResetForm.handleSubmit(onRequestReset)}>
          <FieldGroup>
            <Controller
              name="email"
              control={requestResetForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>

                  <Input
                    {...field}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" className="mt-6 w-full" disabled={requestReset.isPending}>
            {requestReset.isPending ? 'Sending...' : 'Send Reset Link'}
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
