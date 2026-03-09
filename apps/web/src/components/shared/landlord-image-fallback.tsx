'use client';

import { ImageOff } from 'lucide-react';

type LandlordImageFallbackProps = {
  className?: string;
  logoClassName?: string;
};

export const isSafeLandlordImageSrc = (src: string | null | undefined) => {
  if (!src) return false;
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith('file:') || value.startsWith('blob:')) return false;
  return true;
};

export function LandlordImageFallback({
  className = '',
  logoClassName = ''
}: LandlordImageFallbackProps) {
  return (
    <div
      className={`flex items-center justify-center border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 ${className}`}>
      <div className="rounded-xl bg-white/85 p-2.5 shadow-sm backdrop-blur-sm">
        <ImageOff className={`text-slate-500 ${logoClassName || 'size-8'}`} strokeWidth={1.8} />
      </div>
    </div>
  );
}
