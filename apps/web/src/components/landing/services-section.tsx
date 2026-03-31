'use client';

import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { Badge } from '~/shared/shadcn/badge';
import { Card } from '~/shared/shadcn/card';
import { Carousel, CarouselContent, CarouselItem } from '~/shared/shadcn/carousel';

import type { ServiceNode } from './types';
import type { CarouselApi } from '~/shared/shadcn/carousel';

const MotionCard = motion(Card);

type ServicesSectionProps = {
  servicesNodes: readonly ServiceNode[];
};

export function ServicesSection({ servicesNodes }: ServicesSectionProps) {
  const [servicesApi, setServicesApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!servicesApi) return;

    const interval = setInterval(() => {
      if (servicesApi.canScrollNext()) {
        servicesApi.scrollNext();
      } else {
        servicesApi.scrollTo(0);
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [servicesApi]);

  return (
    <section
      id="services"
      className="bg-foreground text-background px-[clamp(1rem,4vw,3rem)] py-16 md:py-32">
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>
          <Badge className="bg-primary text-primary-foreground mb-4 inline-block rounded-sm border-0 px-2 py-1 text-xs font-black tracking-widest uppercase">
            ANALYTICS + AI ASSISTANCE
          </Badge>
          <h2 className="text-background m-0 text-[clamp(2.2rem,10vw,5.5rem)] leading-[0.9] font-black tracking-tighter uppercase">
            TOOLS THAT HELP YOU DECIDE FASTER
          </h2>
          <p className="text-background mt-5 text-[1.2rem] font-bold uppercase">
            PRACTICAL INSIGHTS AND SUGGESTIONS YOU CAN REVIEW
          </p>
        </motion.div>

        <Carousel
          setApi={setServicesApi}
          opts={{ align: 'start', loop: true }}
          className="md:hidden">
          <CarouselContent>
            {servicesNodes.map((srv, idx) => (
              <CarouselItem key={srv.title} className="basis-[86%] pl-4">
                <MotionCard
                  className="border-border/30 bg-card/10 hover:bg-card/15 h-full rounded-2xl border p-6 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}>
                  <h3 className="text-secondary text-[1.9rem] leading-[0.95] font-black tracking-tight uppercase">
                    {srv.title}
                  </h3>
                  <p className="text-background/80 leading-[1.6] font-semibold">{srv.desc}</p>
                </MotionCard>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {servicesNodes.map((srv, idx) => (
            <MotionCard
              key={srv.title}
              className="border-border/30 bg-card/10 hover:bg-card/15 h-full rounded-2xl border p-6 transition-colors md:p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}>
              <h3 className="text-secondary text-[1.9rem] leading-[0.95] font-black tracking-tight uppercase md:text-[2.2rem]">
                {srv.title}
              </h3>
              <p className="text-background/80 leading-[1.6] font-semibold">{srv.desc}</p>
            </MotionCard>
          ))}
        </div>
      </div>
    </section>
  );
}
