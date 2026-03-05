'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { trpcClient } from '~/utils/trpc';

export default function JoinFlowNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await trpcClient.auth.logout.mutate();
    } catch {
      toast.error('Failed to logout');
    } finally {
      router.replace('/resident/auth');
      router.refresh();
    }
  };

  return (
    <header className="bg-card sticky top-0 z-20 border-b p-4 backdrop-blur-md transition-all duration-300 sm:p-5">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1 transition-opacity hover:opacity-90">
          <div className="relative ml-[-5px] flex size-10 items-center justify-center overflow-hidden rounded-xl transition-all hover:opacity-90 sm:size-12">
            <Image src="/assets/Logo.png" alt="Bunkezy Logo" fill className="object-cover" />
          </div>
          <div>
            <p className="text-foreground text-md font-bold tracking-tight sm:text-lg">Bunkezy</p>
            <p className="text-muted-foreground text-[8px] font-medium tracking-wider whitespace-nowrap uppercase sm:text-[11px]">
              Living Made Easy
            </p>
          </div>
        </Link>

        <Button
          variant="destructive"
          onClick={handleLogout}
          className="inline-flex items-center gap-2">
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
