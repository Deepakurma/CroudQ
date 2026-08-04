import React from 'react';
import Link from 'next/link';

import { ChevronRight } from 'lucide-react';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-background/95 sticky inset-x-0 top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex flex-row text-3xl leading-none font-black">
            <span className="block">Croud</span>
            <span className="text-primary block">Q</span>
          </Link>

          <a
            href="/dashboard"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors">
            Try It Now
            <ChevronRight className="ml-1 size-4" />
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
