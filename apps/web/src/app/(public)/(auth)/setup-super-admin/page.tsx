'use client';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getPublicErrorMessage } from '~/lib/trpc-error';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/shared/shadcn/card';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(-10);

export default function SetupSuperAdminPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    setIsLoading(true);
    try {
      await trpcClient.auth.setupSuperAdmin.mutate({
        phoneNumber
      });

      toast.success(`Super admin configured for ${phoneNumber}`);
    } catch (error) {
      toast.error(
        getPublicErrorMessage(error, 'Could not configure super admin right now. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-4 p-4 sm:p-8">
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Temporary Super Admin Setup</CardTitle>
          <CardDescription>Use this page once, then remove it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center gap-2">
              <div className="bg-muted text-muted-foreground flex h-11 items-center rounded-xl px-3 text-sm font-medium">
                +91
              </div>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(normalizePhone(event.target.value))}
                placeholder="Enter 10-digit number"
                inputMode="numeric"
                maxLength={10}
                className="h-11"
              />
            </div>
          </div>

          <Button type="button" onClick={handleSubmit} disabled={isLoading} className="h-11 w-full">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Configure Super Admin'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
