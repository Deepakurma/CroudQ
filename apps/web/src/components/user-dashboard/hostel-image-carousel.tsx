'use client';

import * as React from 'react';
import Image from 'next/image';

import { Carousel, CarouselContent, CarouselItem } from '~/shared/shadcn/carousel';

import type { CarouselApi } from '~/shared/shadcn/carousel';

type HostelImageCarouselProps = {
  images: string[];
  hostelName: string;
};

const getSafeImageSrc = (src: string) => {
  if (!src || src.startsWith('file:') || src.startsWith('blob:')) {
    return '/assets/Full-Logo.jpeg';
  }
  return src;
};

export function HostelImageCarousel({ images, hostelName }: HostelImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(images.length);

  React.useEffect(() => {
    if (!api) return;

    const sync = () => {
      setCurrent(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };

    sync();
    api.on('select', sync);
    api.on('reInit', sync);

    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api]);

  return (
    <div className="relative w-full">
      <Carousel setApi={setApi} opts={{ loop: false }} className="w-full">
        <CarouselContent className="ml-0">
          {images.map((image, index) => (
            <CarouselItem key={`${image}-${index}`} className="pl-0">
              <div className="relative h-[300px] w-full overflow-hidden">
                <Image
                  src={getSafeImageSrc(image)}
                  alt={`${hostelName} image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {count > 1 && (
        <div className="bg-background/80 absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-2 py-1 backdrop-blur-sm">
          {Array.from({ length: count }).map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                index === current ? 'bg-primary w-3' : 'bg-muted-foreground'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
