'use client';

import Link from 'next/link';

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

import { trpc } from '~/utils/trpc';

const formSchema = z.object({
  email: z.email('Please enter a valid email address.')
});

export default function Signup() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    }
  });

  const requestReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => {
        toast.success('Check your email for a reset link.');
      },
      onError: (err) => {
        toast.error(err.message);
      }
    })
  );

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await requestReset.mutateAsync(data);
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Link href="/" className="flex text-3xl leading-none font-black">
        <span>Croud</span>
        <span className="text-primary">Q</span>
      </Link>

      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Fill in your details to create a new account.</CardDescription>
        </CardHeader>

        <CardContent>
          <form id="reset-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      autoComplete="email"
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
          <Field orientation="horizontal">
            <Button type="submit" form="reset-form">
              Create Account
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
