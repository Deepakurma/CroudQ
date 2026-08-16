'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '~/shared/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/shared/shadcn/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '~/shared/shadcn/field';
import { Input } from '~/shared/shadcn/input';

import { queryClient, trpc } from '~/utils/trpc';

const formSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits.')
    .max(6, 'Verification code must be 6 digits.')
});

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: ''
    }
  });

  const verifySignupOtp = useMutation(
    trpc.auth.verifySignupOtp.mutationOptions({
      onSuccess: async () => {
        toast.success('Email verified successfully.');
        await queryClient.invalidateQueries({
          queryKey: trpc.auth.getSession.queryOptions().queryKey
        });
        router.replace('/dashboard');
      },
      onError: (err) => {
        toast.error(err.message);
      }
    })
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!email) {
      toast.error('Missing email address.');
      return;
    }

    await verifySignupOtp.mutateAsync({
      email,
      code: values.code
    });
  };
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>

          <CardDescription>
            Enter the verification code sent to
            <br />
            <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="verify-email-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="code">Verification Code</FieldLabel>

                    <Input
                      {...field}
                      id="code"
                      placeholder="123456"
                      autoComplete="one-time-code"
                      maxLength={6}
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            form="verify-email-form"
            className="w-full"
            disabled={verifySignupOtp.isPending}>
            {verifySignupOtp.isPending ? 'Verifying...' : 'Verify Email'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
