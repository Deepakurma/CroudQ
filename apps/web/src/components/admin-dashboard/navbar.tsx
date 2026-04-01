'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { cn } from '~/lib/utils';
import { Button } from '~/shared/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';

import { trpcClient } from '~/utils/trpc';

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    isActive: (pathname: string) => pathname === '/admin'
  },
  {
    href: '/admin/subscriptions',
    label: 'Subscriptions',
    isActive: (pathname: string) => pathname.startsWith('/admin/subscriptions')
  }
];

export default function AdminNavbar() {
  const { setTheme } = useTheme();
  const pathname = usePathname();
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
        <Link href="/" className="flex shrink-0 flex-col transition-opacity hover:opacity-90">
          <p className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
            Croud<span className="text-primary">Q</span>
          </p>
          <p className="text-muted-foreground text-[8px] font-medium tracking-wider whitespace-nowrap uppercase sm:text-[11px]">
            Admin Control
          </p>
        </Link>

        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const active = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'hover:bg-muted/80 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                    active ? 'text-primary' : 'text-foreground'
                  )}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-8">
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
