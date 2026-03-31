'use client';

import Link from 'next/link';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export function FinalCtaSection() {
  return (
    <section
      className="flex min-h-[85vh] flex-col items-center justify-center px-[clamp(1rem,4vw,3rem)] py-16 text-center md:min-h-[90vh]"
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
          href={'#'}
          className="bg-background text-foreground hover:bg-background/90 mx-auto mt-10 flex w-fit flex-row items-center gap-2 rounded-full px-6 py-3 text-[1rem] font-bold transition-transform hover:scale-105 md:mt-12 md:text-[1.1rem]">
          Get early access <ChevronRight className="h-5 w-5" />
        </Link>
      </motion.div>
    </section>
  );
}
