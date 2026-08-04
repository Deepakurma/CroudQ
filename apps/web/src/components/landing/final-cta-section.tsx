'use client';

import Link from 'next/link';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export function FinalCtaSection() {
  const year = new Date().getFullYear();

  return (
    <section
      className="relative flex min-h-[85vh] flex-col items-center justify-center px-[clamp(1rem,4vw,3rem)] py-16 text-center md:min-h-[90vh]"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, var(--accent)) 0%, color-mix(in srgb, var(--secondary) 72%, var(--primary)) 100%)'
      }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}>
        <h2 className="text-primary-foreground m-0 text-[clamp(2.4rem,11vw,8.5rem)] leading-[0.87] font-black tracking-tighter uppercase">
          LESS GUESSWORK.
          <br />
          BETTER CREATOR DECISIONS.
        </h2>
        <p className="text-primary-foreground/85 mt-10 text-[1.3rem] font-bold tracking-wide uppercase md:text-[1.5rem]">
          CROUDQ HELPS YOU PLAN CONTENT WITH ANALYTICS AND AI SUPPORT
        </p>
        <Link
          href={'/dashboard'}
          className="bg-background text-foreground hover:bg-background/90 mx-auto mt-10 flex w-fit flex-row items-center gap-2 rounded-full px-6 py-3 text-[1rem] font-bold transition-transform hover:scale-105 md:mt-12 md:text-[1.1rem]">
          Try It Now <ChevronRight className="h-5 w-5" />
        </Link>
      </motion.div>
      <div className="text-primary-foreground/80 absolute right-0 bottom-6 left-0 flex flex-col items-center gap-2 px-[clamp(1rem,4vw,3rem)]">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm font-medium">
          <Link href="/privacy-policy" className="hover:text-primary-foreground transition-colors">
            Privacy Policy
          </Link>
          <span className="text-primary-foreground/45" aria-hidden="true">
            |
          </span>
          <Link
            href="/terms-of-service"
            className="hover:text-primary-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
        <p className="text-primary-foreground/70 text-xs font-medium tracking-wide uppercase">
          © {year} CroudQ. All rights reserved.
        </p>
      </div>
    </section>
  );
}
