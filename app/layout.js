import './globals.css'
import { Providers } from './providers'
import Script from 'next/script'
import { Playfair_Display, Inter, Cormorant_Garamond } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-cormorant', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata = {
  title: 'SutraKriti — Handcrafted Crochet, Woven with Love',
  description: 'Every thread tells a story. Discover luxury handmade crochet handbags, potli bags, bouquet blankets, flowers, and personalised gifts by SutraKriti.',
  keywords: ['handmade crochet', 'crochet handbag', 'potli bag', 'bouquet blanket', 'crochet flowers', 'personalised gifts', 'wedding gifts', 'SutraKriti'],
  authors: [{ name: 'SutraKriti' }],
  openGraph: {
    title: 'SutraKriti — Every Thread Tells a Story',
    description: 'Luxury handcrafted crochet creations. Handbags, potli bags, bouquets, home decor & personalised gifts.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'SutraKriti',
    images: [{ url: 'https://images.unsplash.com/photo-1539215398023-f3ac3405795f?w=1200', width: 1200, height: 630, alt: 'SutraKriti handcrafted crochet' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SutraKriti — Every Thread Tells a Story',
    description: 'Luxury handcrafted crochet creations.',
    images: ['https://images.unsplash.com/photo-1539215398023-f3ac3405795f?w=1200'],
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SutraKriti',
  url: 'https://sutrakriti.com',
  logo: 'https://sutrakriti.com/logo.png',
  description: 'Luxury handcrafted crochet brand — handmade bags, blankets, flowers and personalised gifts.',
  sameAs: ['https://www.instagram.com/_sutrakriti'],
  contactPoint: { '@type': 'ContactPoint', email: 'sutrakriti.help@outlook.com', contactType: 'customer service', areaServed: 'IN' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
