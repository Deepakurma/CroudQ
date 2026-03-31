'use client';

export type CharacterVariant = 'creator' | 'foundation' | 'analysis' | 'planning' | 'iteration';

type CharacterProps = {
  tone: string;
  variant?: CharacterVariant;
};

const undrawByVariant: Record<CharacterVariant, string> = {
  creator: 'https://cdn.undraw.co/illustrations/social-influencer_hsqo.svg',
  foundation: 'https://cdn.undraw.co/illustration/nfc-sharing_tt2d.svg',
  analysis: 'https://cdn.undraw.co/illustration/file-analysis_nbtc.svg',
  planning: 'https://cdn.undraw.co/illustration/ideas_vn7a.svg',
  iteration: 'https://cdn.undraw.co/illustration/successful_rtc4.svg'
};

export function Character({ tone, variant = 'creator' }: CharacterProps) {
  const illustration = undrawByVariant[variant];

  return (
    <div className="relative grid aspect-square w-full place-items-center">
      <div
        className="relative aspect-square w-[92%] overflow-hidden rounded-sm"
        style={{ backgroundColor: tone }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={illustration}
          alt="unDraw creator illustration"
          className="h-full w-full object-contain p-1"
          loading="lazy"
        />
      </div>
    </div>
  );
}
