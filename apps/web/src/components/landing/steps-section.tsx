'use client';

import { motion } from 'framer-motion';

import { Badge } from '~/shared/shadcn/badge';

import { Character } from '~/components/landing/character';

import type { StepItem } from './types';

type StepsSectionProps = {
  steps: readonly StepItem[];
};

export function StepsSection({ steps }: StepsSectionProps) {
  const variantByStepId = {
    FOUNDATION: 'foundation',
    ANALYSIS: 'analysis',
    PLANNING: 'planning',
    ITERATION: 'iteration'
  } as const;
  const labelByStepId = {
    FOUNDATION: 'CONNECT',
    ANALYSIS: 'ANALYZE',
    PLANNING: 'PLAN',
    ITERATION: 'GROW'
  } as const;

  return (
    <div id="workflow">
      {steps.map((step) => (
        <section
          key={step.id}
          className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden px-[clamp(1rem,4vw,3rem)] py-6 shadow-2xl md:py-32 [@media(max-height:760px)]:py-6 sm:[@media(max-height:760px)]:py-7"
          style={{ background: step.bg }}>
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-24 [@media(max-height:760px)]:gap-7 [@media(max-height:760px)_and_(min-width:700px)]:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              className="order-2 lg:order-1 [@media(max-height:760px)_and_(min-width:700px)]:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}>
              <Badge
                variant="outline"
                className="border-foreground/20 bg-card/40 text-foreground mb-8 inline-block rounded-sm px-3 py-1 text-xs font-black tracking-widest uppercase md:text-sm [@media(max-height:760px)]:mb-6">
                {labelByStepId[step.id as keyof typeof labelByStepId] ?? step.id}
              </Badge>
              <h2 className="text-foreground m-0 text-[clamp(1.8rem,8.5vw,6.5rem)] leading-[0.9] font-black tracking-tighter uppercase [@media(max-height:760px)]:text-[clamp(1.7rem,6.5vw,4.5rem)]">
                {step.title}
              </h2>
              <p className="text-foreground/90 mt-3 text-[0.95rem] leading-[1.2] font-bold uppercase md:mt-8 md:text-[clamp(1.05rem,1.8vw,1.6rem)] [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:text-[0.9rem]">
                {step.sub}
              </p>
              <p className="text-foreground/80 mt-3 max-w-[500px] text-[0.92rem] leading-relaxed font-semibold md:mt-6 md:text-[1.3rem] [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:text-[0.92rem]">
                {step.copy}
              </p>
            </motion.div>
            <motion.div
              className="order-1 mx-auto w-full max-w-[220px] sm:max-w-[280px] lg:order-2 lg:max-w-[500px] [@media(max-height:760px)]:max-w-[170px] sm:[@media(max-height:760px)]:max-w-[220px] [@media(max-height:760px)_and_(min-width:700px)]:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}>
              <Character
                tone={step.card}
                variant={variantByStepId[step.id as keyof typeof variantByStepId] ?? 'creator'}
              />
            </motion.div>
          </div>
        </section>
      ))}
    </div>
  );
}
