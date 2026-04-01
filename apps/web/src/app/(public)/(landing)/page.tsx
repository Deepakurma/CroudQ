import { CardFanSection } from '~/components/landing/card-fan-section';
import { FinalCtaSection } from '~/components/landing/final-cta-section';
import { HeroSection } from '~/components/landing/hero-section';
import { ServicesSection } from '~/components/landing/services-section';
import { StepsSection } from '~/components/landing/steps-section';

const chips = [
  'BUILT FOR REAL CREATOR WORKFLOWS',
  'AI-ASSISTED INSIGHTS FROM YOUR CONTENT DATA',
  'UNDERSTAND AND LISTEN YOUR AUDIENCE'
] as const;

const fanCards = [
  {
    title: 'SOLO CREATORS',
    color: 'color-mix(in srgb, var(--primary) 14%, var(--card))',
    dot: 'var(--primary)',
    titleColor: 'color-mix(in srgb, var(--foreground) 72%, var(--primary))',
    descColor: 'color-mix(in srgb, var(--foreground) 90%, var(--primary))',
    rot: -15,
    x: -210,
    desc: 'Running everything alone is hard. CroudQ helps you decide what to make next without second-guessing.'
  },
  {
    title: 'CONSISTENT CREATORS',
    color: 'color-mix(in srgb, var(--secondary) 16%, var(--card))',
    dot: 'var(--secondary)',
    titleColor: 'color-mix(in srgb, var(--foreground) 86%, var(--secondary))',
    descColor: 'color-mix(in srgb, var(--foreground) 90%, var(--secondary))',
    rot: -9,
    x: -130,
    desc: 'Stay consistent with clearer signals on what is working so your next content decision is easier.'
  },
  {
    title: 'SHORT-FORM CREATORS',
    color: 'color-mix(in srgb, var(--chart-5) 14%, var(--card))',
    dot: 'var(--chart-5)',
    titleColor: 'color-mix(in srgb, var(--foreground) 74%, var(--chart-5))',
    descColor: 'color-mix(in srgb, var(--foreground) 90%, var(--chart-5))',
    rot: -3,
    x: -48,
    desc: 'See which formats and hooks drive stronger response so you can iterate your short-form strategy.'
  },
  {
    title: 'LONG-FORM CREATORS',
    color: 'color-mix(in srgb, var(--chart-3) 14%, var(--card))',
    dot: 'var(--chart-3)',
    titleColor: 'color-mix(in srgb, var(--foreground) 74%, var(--chart-3))',
    descColor: 'color-mix(in srgb, var(--foreground) 90%, var(--chart-3))',
    rot: 3,
    x: 38,
    desc: 'Understand retention and audience behavior so each upload starts with a clearer game plan.'
  },
  {
    title: 'CREATOR TEAMS',
    color: 'color-mix(in srgb, var(--chart-4) 14%, var(--card))',
    dot: 'var(--chart-4)',
    titleColor: 'color-mix(in srgb, var(--foreground) 74%, var(--chart-4))',
    descColor: 'color-mix(in srgb, var(--foreground) 90%, var(--chart-4))',
    rot: 9,
    x: 120,
    desc: 'Give your editor, strategist, and social manager one shared view of what is performing and why.'
  },
  {
    title: 'GROWTH-FOCUSED BRANDS',
    color: 'color-mix(in srgb, var(--primary) 10%, var(--accent))',
    dot: 'var(--primary)',
    titleColor: 'color-mix(in srgb, var(--foreground) 72%, var(--primary))',
    descColor: 'color-mix(in srgb, var(--foreground) 90%, var(--primary))',
    rot: 15,
    x: 202,
    desc: 'Check how your brand content is landing with audiences, then decide your next content priorities.'
  }
] as const;

const servicesNodes = [
  {
    title: 'CONNECTED CHANNELS',
    desc: 'Connect your YouTube channel first, then add other platforms to keep your performance view in one place.'
  },
  {
    title: 'PERFORMANCE INSIGHTS',
    desc: 'See which videos and topics are moving your growth, and which ones are quietly slowing you down.'
  },
  {
    title: 'COMMENT INTELLIGENCE',
    desc: 'Learn what your audience keeps asking for so your next content feels timely, relevant, and wanted.'
  },
  {
    title: 'AI TREND SIGNALS',
    desc: 'Use AI-assisted pattern detection to spot rising topics in your recent content and comments.'
  },
  {
    title: 'AI CONTENT SUGGESTIONS',
    desc: 'Get practical AI-generated content suggestions based on your recent performance and audience feedback.'
  },
  {
    title: 'WEEKLY CLARITY',
    desc: 'Know where to focus each week so your content and community keep improving with less stress.'
  }
] as const;

const steps = [
  {
    id: 'FOUNDATION',
    title: 'CONNECT YOUR CHANNELS',
    sub: 'START WITH YOUTUBE, THEN EXPAND',
    copy: 'Link your YouTube account and CroudQ organizes your core performance data into one clean view.',
    bg: 'var(--background)',
    card: 'var(--accent)'
  },
  {
    id: 'ANALYSIS',
    title: 'SEE WHAT IS WORKING',
    sub: 'PERFORMANCE, RETENTION, AND AUDIENCE SIGNALS TOGETHER',
    copy: 'Move beyond surface metrics. Understand what content is helping performance and what to improve next.',
    bg: 'color-mix(in srgb, var(--chart-3) 8%, var(--muted))',
    card: 'var(--muted)'
  },
  {
    id: 'PLANNING',
    title: 'PLAN YOUR NEXT MOVES',
    sub: 'AI SUGGESTIONS YOU CAN REVIEW AND SHIP THIS WEEK',
    copy: 'Use AI-assisted suggestions as a starting point, then choose the ideas that fit your voice and goals.',
    bg: 'color-mix(in srgb, var(--chart-5) 8%, var(--accent))',
    card: 'var(--card)'
  },
  {
    id: 'ITERATION',
    title: 'GROW WITH CONFIDENCE',
    sub: 'LESS NOISE, BETTER DECISIONS, STRONGER CONTENT',
    copy: 'Spend less time overthinking dashboards and more time refining content based on clear audience feedback.',
    bg: 'var(--secondary)',
    card: 'var(--accent)'
  }
] as const;

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground w-full overflow-clip">
      <HeroSection chips={chips} />
      <CardFanSection fanCards={fanCards} />
      <ServicesSection servicesNodes={servicesNodes} />
      <StepsSection steps={steps} />
      <FinalCtaSection />
    </div>
  );
}
