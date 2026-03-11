'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '~/shared/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';
import { SidebarTrigger } from '~/shared/shadcn/sidebar';

import { trpcClient } from '~/utils/trpc';

export default function AdminNavbar() {
  const { setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await trpcClient.auth.logout.mutate();
    } finally {
      router.replace('/auth?redirect=/admin/dashboard');
      router.refresh();
    }
  };

  return (
    <header className="bg-card sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-md">
      <SidebarTrigger className="mr-2 ml-[-15px] hidden p-5 md:flex" />

      <div className="flex w-full items-center gap-4">
        <div className="flex w-full items-center justify-between gap-5">
          <div className="hidden md:block">
            <h2 className="items-baseline text-2xl font-semibold tracking-tighter select-none">
              <span className="animate-in fade-in blur-in slide-in-from-bottom-2 fill-mode-both inline-block duration-1000">
                <span className="inline-block origin-bottom-left animate-bounce [--tw-bounce-offset:-3px] [animation-duration:1.2s] [animation-iteration-count:2]">
                  Hello
                </span>
              </span>
              <span className="ml-0.5">,</span>
            </h2>
            <p className="text-muted-foreground text-[13px]">{new Date().toDateString()}</p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1 transition-opacity hover:opacity-90 md:hidden">
            <div className="relative ml-[-5px] flex size-10 items-center justify-center overflow-hidden rounded-xl transition-all hover:opacity-90 sm:size-12">
              <Image src="/assets/Logo.png" alt="Bunkezy Logo" fill className="object-cover" />
            </div>
            <div>
              <p className="text-foreground text-md font-bold tracking-tight sm:text-lg">Bunkezy</p>
              <p className="text-muted-foreground text-[8px] font-medium tracking-wider whitespace-nowrap uppercase sm:text-[11px]">
                Admin Control
              </p>
            </div>
          </Link>
        </div>

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
    </header>
  );
}
