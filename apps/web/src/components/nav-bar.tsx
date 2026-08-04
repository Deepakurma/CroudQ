'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useMutation } from '@tanstack/react-query';
import { LogOut, TextAlignJustify, X } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '~/lib/utils';
import { Button } from '~/shared/shadcn/button';

import { queryClient, trpc } from '~/utils/trpc';

export function AppNavbar() {
  const pathname = usePathname();
  const [openMenu, setMenuOpen] = useState<boolean>(false);

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

  return (
    <>
      <header className="bg-background/95 sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b backdrop-blur">
        <div className="flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Link
                href="/dashboard"
                className="flex flex-row text-2xl leading-none font-black font-bold sm:text-3xl">
                <span className="block">Croud</span>
                <span className="text-primary block">Q</span>
              </Link>
            </div>
          </div>

          <div className="hidden items-center gap-14 sm:flex">
            <Link
              className={cn(
                'transition-colors hover:underline',
                pathname.startsWith('/dashboard') ? 'text-primary' : ''
              )}
              href="/dashboard">
              Dashboard
            </Link>
            <Link
              className={cn(
                'transition-colors hover:underline',
                pathname.startsWith('/videos') ? 'text-primary' : ''
              )}
              href="/videos">
              Videos
            </Link>
            <Link
              className={cn(
                'transition-colors hover:underline',
                pathname.startsWith('/settings') ? 'text-primary' : ''
              )}
              href="/settings">
              Settings
            </Link>
            <Button onClick={() => Logout.mutate()} variant="ghost" size="icon">
              <LogOut className="text-destructive size-5" />
            </Button>
          </div>

          <Button
            className="sm:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            variant="ghost"
            size="icon">
            {!openMenu ? <TextAlignJustify className="size-5" /> : <X className="size-5" />}
          </Button>
        </div>
      </header>

      {openMenu && (
        <div className="bg-background/95 fixed top-15 right-4 z-10 flex flex-col gap-6 rounded-md p-6 sm:hidden">
          <Link
            onClick={() => setMenuOpen(false)}
            className={cn(
              'transition-colors hover:underline',
              pathname.startsWith('/dashboard') ? 'text-primary' : ''
            )}
            href="/dashboard">
            Dashboard
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            className={cn(
              'transition-colors hover:underline',
              pathname.startsWith('/videos') ? 'text-primary' : ''
            )}
            href="/videos">
            Videos
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            className={cn(
              'transition-colors hover:underline',
              pathname.startsWith('/settings') ? 'text-primary' : ''
            )}
            href="/settings">
            Settings
          </Link>
        </div>
      )}
    </>
  );
}
