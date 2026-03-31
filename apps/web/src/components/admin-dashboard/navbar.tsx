'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';

import { trpcClient } from '~/utils/trpc';

export default function AdminNavbar() {
  const { setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await trpcClient.adminAuth.logout.mutate();
      toast.success('Logged out');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to logout.';
      toast.error(message);
    } finally {
      router.replace('/auth/admin/login?redirect=/admin');
      router.refresh();
    }
  };

  return (
    <header className="bg-card sticky top-0 z-30 flex h-16 items-center justify-center border-b px-6 backdrop-blur-md">
      <div className="flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-1 transition-opacity hover:opacity-90">
          <div className="relative ml-[-5px] flex size-10 items-center justify-center overflow-hidden rounded-xl transition-all hover:opacity-90 sm:size-12">
            <Image src="/assets/Logo.png" alt="CroudQ Logo" fill className="object-cover" />
          </div>
          <div>
            <p className="text-foreground text-md font-bold tracking-tight sm:text-lg">CroudQ</p>
            <p className="text-muted-foreground text-[8px] font-medium tracking-wider whitespace-nowrap uppercase sm:text-[11px]">
              Admin Control
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'ghost'} className="p-5">
                <Sun className="size-5 shrink-0 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-5 shrink-0 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={'ghost'}
                className="bg-card text-primary flex shrink-0 items-center justify-center border shadow-sm">
                <UserRound size={24} className="shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
