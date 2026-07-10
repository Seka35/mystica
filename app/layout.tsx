// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Oracle — Tarot Reading',
  description: 'An immersive AI-powered tarot reading experience. Draw your cards, ask your question, and receive a deeply personal interpretation from The Oracle.',
  keywords: 'tarot, oracle, reading, spiritual, divination, AI tarot',
  openGraph: {
    title: 'The Oracle — Tarot Reading',
    description: 'Ask the universe. Draw your destiny.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#080010" />
      </head>
      <body className="bg-void-radial min-h-dvh">
        {children}
      </body>
    </html>
  )
}
