import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/I18nProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5F1EA',
}

export const metadata: Metadata = {
  title: 'GraffCloud — Nordic Urban Vandalism Intelligence',
  description: 'Turn graffiti into actionable evidence. Cluster tags, track crew movement across cities, and hand police a case file that actually closes.',
  keywords: ['graffiti', 'vandalism', 'intelligence', 'Norway', 'Oslo', 'property management'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <head>
        <style>{`
          :root {
            --font-display: var(--font-instrument-serif), 'Times New Roman', serif;
            --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
            --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
          }
        `}</style>
      </head>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
