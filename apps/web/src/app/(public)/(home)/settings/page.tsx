'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { LogOut, Youtube } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/shared/shadcn/select';

import { queryClient, trpc } from '~/utils/trpc';

export default function SettingsPage() {
  const Logout = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: async () => {
        toast.success('Logged out!');

        await queryClient.invalidateQueries({
          queryKey: trpc.auth.getSession.queryOptions().queryKey
        });
      },
      onError: (err) => {
        toast.error(err.message);
      }
    })
  );

  const { data: query } = useQuery(trpc.insights.insight.queryOptions());

  const DisconnectYoutube = useMutation(trpc.youtube.disconnect.mutationOptions());

  const { theme, setTheme } = useTheme();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">Settings</h1>
        <p className="text-muted-foreground md:text-md text-xs sm:text-sm">Manage your account.</p>
      </div>

      <div className="space-y-8">
        {/* Account */}
        <div className="rounded-2xl border">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <Youtube className="h-6 w-6 text-red-500" />
              </div>

              <div>
                <h3 className="font-medium">{query?.channelName || 'CroudQ'}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Connected YouTube channel
                </p>
              </div>
            </div>

            <Button onClick={() => DisconnectYoutube.mutate()} variant="outline">
              Disconnect
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-medium">Theme</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Light, dark or follow your system.
              </p>
            </div>

            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logout */}

        <div className="bg-card w-full rounded-xl border">
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-medium">Logout</h3>
              <p className="text-muted-foreground text-sm">Sign out from your current device.</p>
            </div>

            <Button onClick={() => Logout.mutate()} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
