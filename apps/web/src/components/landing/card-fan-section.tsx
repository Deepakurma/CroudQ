'use client';

import React, { useEffect, useRef, useState } from 'react';

import { motion, useScroll, useTransform } from 'framer-motion';

import { Badge } from '~/shared/shadcn/badge';

import type { FanCard } from './types';

type CardFanSectionProps = {
  fanCards: readonly FanCard[];
};

export function CardFanSection({ fanCards }: CardFanSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  return (
    <div ref={containerRef} className="relative h-[360vh] w-full md:h-[400vh]">
      <div className="bg-background sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-[clamp(1rem,4vw,3rem)] md:h-screen">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            className="z-10 mb-2 text-center md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <Badge className="bg-primary text-primary-foreground mb-4 inline-block rounded-sm border-0 px-2 py-1 text-xs font-black uppercase">
              AI FOR CREATOR DECISIONS
            </Badge>
            <h2 className="text-foreground m-0 text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.9] font-black tracking-tighter uppercase">
              WHO IT&apos;S FOR
            </h2>
            <p className="text-foreground mt-3 text-[1.1rem] font-extrabold uppercase md:text-[1.3rem]">
              CREATE MORE. GUESS LESS.
            </p>
          </motion.div>

          <div className="relative mx-auto mt-6 flex h-[340px] w-full max-w-[900px] justify-center md:mt-8 md:h-[400px]">
            {fanCards.map((card, idx) => {
              const segment = 1 / fanCards.length;
              const start = Math.max(0, idx * segment);
              const end = start + segment;
              const yOffset = useTransform(
                scrollYProgress,
                [start, end],
                [isMobile ? 520 : 800, 20]
              );
              const restingRot = isMobile ? card.rot / 2 : card.rot;
              const restingX = isMobile ? card.x / 6 : card.x;
              const rot = useTransform(scrollYProgress, [start, end], [0, restingRot]);
              const xLoc = useTransform(scrollYProgress, [start, end], [0, restingX]);

              return (
                <motion.article
                  key={card.title}
                  className="border-foreground/15 absolute top-3 flex h-[300px] w-[220px] flex-col rounded-xl border-[1.5px] p-5 pt-5 shadow-xl md:top-[20px] md:h-[360px] md:w-[260px] md:p-[1.5rem] md:pt-6"
                  style={{
                    backgroundColor: card.color,
                    rotate: rot,
                    x: xLoc,
                    y: yOffset,
                    transformOrigin: 'bottom center',
                    zIndex: idx
                  }}>
                  <h3
                    className="m-0 text-[1.8rem] leading-[0.92] font-black tracking-tight uppercase md:text-[2.2rem]"
                    style={{ color: card.titleColor }}>
                    {card.title}
                  </h3>
                  <p
                    className="mt-4 text-[0.95rem] leading-[1.45] font-semibold md:mt-5 md:text-[1rem]"
                    style={{ color: card.descColor }}>
                    {card.desc}
                  </p>
                  <div className="mt-auto">
                    <div className="border-foreground/15 bg-card/30 flex h-8 w-8 items-center justify-center rounded-full border">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: card.dot }}
                      />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
