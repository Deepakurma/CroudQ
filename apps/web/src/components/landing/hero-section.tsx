'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { Badge } from '~/shared/shadcn/badge';
import { Card } from '~/shared/shadcn/card';

import { Character } from '~/components/landing/character';

type HeroSectionProps = {
  chips: readonly string[];
};

export function HeroSection({ chips }: HeroSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl overflow-hidden px-[clamp(1rem,4vw,3rem)] py-10 lg:py-14">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-12 xl:gap-16">
        <motion.div
          className="flex flex-col items-start"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Badge className="bg-primary text-primary-foreground mb-6 rounded-sm border-0 px-2 py-1 text-xs font-black tracking-widest uppercase">
            BUILT FOR CREATORS WITH AI ASSISTANCE
          </Badge>
          <h1 className="text-foreground text-[clamp(2.4rem,10vw,8rem)] leading-[0.88] font-black tracking-tight uppercase">
            MAKE CONTENT WITH
            <br />
            MORE CLARITY
          </h1>
          <p className="text-foreground/80 mt-6 max-w-[540px] text-[1.05rem] leading-relaxed font-semibold md:text-[1.15rem]">
            CroudQ combines performance analytics, comment insights, and AI-assisted suggestions to
            help you choose your next move.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mt-2 w-full max-w-[360px] justify-self-center sm:max-w-[420px] lg:mt-0 lg:max-w-[520px] lg:justify-self-end"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <Character tone="var(--accent)" variant="creator" />
        </motion.div>
      </div>

      <motion.div
        className="mt-10 grid grid-cols-1 items-stretch gap-4 md:mt-14 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}>
        {chips.map((chip) => (
          <Card
            key={chip}
            className="border-border bg-card text-foreground flex h-full flex-row items-center gap-4 rounded-xl border px-5 py-5 text-sm font-black uppercase shadow-none">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <span>{chip}</span>
          </Card>
        ))}
      </motion.div>
    </section>
  );
}
