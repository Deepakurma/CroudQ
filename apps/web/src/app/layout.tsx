import * as React from 'react';
import localFont from 'next/font/local';

import { ThemeProvider } from 'next-themes';

import { Toaster } from '~/shared/shadcn/sonner';

import Providers from '~/providers';

import type { Metadata, Viewport } from 'next';

import '../styles/globals.css';

const outfit = localFont({
  src: [
    {
      path: '../../public/fonts/outfit/Outfit_100Thin.ttf',
      weight: '100',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_200ExtraLight.ttf',
      weight: '200',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_300Light.ttf',
      weight: '300',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_400Regular.ttf',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_500Medium.ttf',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_600SemiBold.ttf',
      weight: '600',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_700Bold.ttf',
      weight: '700',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_800ExtraBold.ttf',
      weight: '800',
      style: 'normal'
    },
    {
      path: '../../public/fonts/outfit/Outfit_900Black.ttf',
      weight: '900',
      style: 'normal'
    }
  ],
  variable: '--font-outfit',
  display: 'swap'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: {
    default: 'CroudQ | Creator Analytics, Comment Insights, and AI Content Suggestions',
    template: '%s | CroudQ'
  },
  icons: {
    icon: '/favicon.ico'
  },
  description:
    'CroudQ helps creators understand video performance, audience comment signals, and AI-powered next-step suggestions so they can plan better content with more clarity.',
  keywords: [
    'CroudQ',
    'creator analytics',
    'YouTube analytics',
    'comment insights',
    'audience feedback analysis',
    'AI content suggestions',
    'content strategy tools',
    'creator growth tools'
  ],
  authors: [{ name: 'CroudQ' }],
  creator: 'CroudQ',
  publisher: 'CroudQ',
  applicationName: 'CroudQ',
  category: 'Creator Analytics',
  openGraph: {
    title: 'CroudQ | Creator Analytics, Comment Insights, and AI Content Suggestions',
    description:
      'Track performance, understand audience feedback, and get AI-assisted content suggestions built for creators and connected channels.',
    type: 'website',
    siteName: 'CroudQ'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CroudQ | Creator Analytics and AI Insight Tools',
    description:
      'Performance analytics, comment intelligence, and AI-assisted suggestions to help creators decide what to make next.'
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange>
          <Providers>{children}</Providers>
          <Toaster position="top-right" offset={50} richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
