'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Mail, MapPin, MessageSquarePlus } from 'lucide-react';

import { Separator } from '~/shared/shadcn/separator';

import { WriteFeedback } from './write-feedback';

export function UserDashboardFooter() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  return (
    <footer className="border-t p-4 sm:p-5">
      <div className="mx-auto w-full max-w-7xl">
        <div className="bg-card flex flex-col items-center justify-between gap-5 rounded-3xl border p-6 shadow-sm sm:flex-row md:p-8">
          <div className="w-full max-w-3xl space-y-1.5">
            <Link href="/" className="inline-flex items-center gap-1">
              <div className="relative ml-[-5px] flex size-10 items-center justify-center overflow-hidden rounded-xl hover:opacity-90">
                <Image src="/assets/Logo.png" alt="Bunkezy Logo" fill className="object-cover" />
              </div>
              <div>
                <p className="text-foreground text-md font-bold tracking-tight">Bunkezy</p>
                <p className="text-muted-foreground text-[9px] font-medium tracking-wider uppercase">
                  Living Made Easy
                </p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm">
              Find your ideal rental property or property with a smooth, hassle-free search.
            </p>

            <p className="text-sm leading-relaxed">
              Want to list your property?{' '}
              <Link
                href={'/auth?redirect=/landlord/onboarding'}
                className="text-primary hover:underline">
                Add Property +
              </Link>
            </p>

            <p className="text-muted-foreground mt-2 hidden text-xs sm:block">
              © {new Date().getFullYear()} Bunkezy. All rights reserved.
            </p>
          </div>

          <Separator className="block sm:hidden" />

          <div className="flex w-full flex-row items-center justify-between gap-0 sm:gap-5">
            <div className="border-border w-1/2 flex-1 space-y-3 sm:w-full md:w-1/4">
              <h4 className="text-sm font-semibold tracking-wide uppercase">Quick Links</h4>
              <div className="text-muted-foreground flex flex-col gap-2 text-sm">
                <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-foreground whitespace-nowrap transition-colors">
                  Terms & Conditions
                </Link>
                <Link href="/about-us" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </div>
            </div>

            {/* <div className="bg-border h-30 w-[1px]" /> */}

            <div className="w-1/2 flex-1 space-y-3 sm:w-full md:w-1/4">
              <h4 className="text-sm font-semibold tracking-wide uppercase">Contact</h4>
              <div className="text-muted-foreground flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="text-primary size-4 shrink-0" />
                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="hover:text-foreground cursor-pointer text-left transition-colors">
                    Write Feedback
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="text-primary size-4 shrink-0" />
                  <span>support@bunkezy.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary size-4 shrink-0" />
                  <span>Hyderabad, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* <Separator /> */}
          <p className="text-muted-foreground text-xs sm:hidden">
            © {new Date().getFullYear()} Bunkezy. All rights reserved.
          </p>
        </div>
      </div>
      <WriteFeedback isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </footer>
  );
}
