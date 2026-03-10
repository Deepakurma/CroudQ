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
  title: 'Bunkezy - Living Made Easy',
  icons: {
    icon: '/favicon.ico'
  },
  description:
    'Find a hostel or rental that fits, apply fast, and settle in without the usual hassle.',
  keywords: [
    'hostels',
    'apartments',
    'co-living',
    'boys hostel',
    'girls hostel',
    'pg',
    'pgs near me',
    'hostels near me',
    'rentals near me',
    'rooms for rent',
    'apartments for rent',
    'student housing',
    'shared accommodation',
    'rental application',
    'tenant portal',
    'move in checklist'
  ],
  authors: [{ name: 'Bunkezy' }],
  creator: 'Bunkezy',
  publisher: 'Bunkezy',
  openGraph: {
    title: 'Bunkezy',
    description:
      'Find a hostel or rental that fits, apply fast, and settle in without the usual hassle.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bunkezy - Living Made Easy',
    description:
      'Find a hostel or rental that fits, apply fast, and settle in without the usual hassle.'
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
