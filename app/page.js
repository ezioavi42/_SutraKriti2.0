'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import {
  ArrowRight, ArrowUpRight, Sparkles, Heart, Leaf, Gift, ShieldCheck, Palette, Feather, Award,
  Instagram, Mail, MessageCircle, Star, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag, Menu, Send, Truck, Package, Scissors
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { toast, Toaster } from 'sonner'

const WHATSAPP_NUMBER = '917777932385'
const IG_URL = 'https://www.instagram.com/_sutrakriti'
const EMAIL = 'sutrakriti.help@outlook.com'

const CATEGORIES = ['All', 'Handbags', 'Potli Bags', 'Flowers', 'Home Decor']

const GALLERY = [
  { src: 'https://images.pexels.com/photos/10820406/pexels-photo-10820406.jpeg', h: 460 },
  { src: 'https://images.unsplash.com/photo-1645516956968-dee62f4a9090', h: 360 },
  { src: 'https://images.pexels.com/photos/30224898/pexels-photo-30224898.jpeg', h: 520 },
  { src: 'https://images.pexels.com/photos/20269075/pexels-photo-20269075.jpeg', h: 380 },
  { src: 'https://images.unsplash.com/photo-1571434976902-a6e3e1eb0d51', h: 440 },
  { src: 'https://images.pexels.com/photos/32452334/pexels-photo-32452334.jpeg', h: 400 },
  { src: 'https://images.pexels.com/photos/5806996/pexels-photo-5806996.jpeg', h: 480 },
  { src: 'https://images.unsplash.com/photo-1560347964-838d2f63cdc0', h: 340 },
  { src: 'https://images.pexels.com/photos/18971489/pexels-photo-18971489.jpeg', h: 500 },
  { src: 'https://images.pexels.com/photos/36238478/pexels-photo-36238478.jpeg', h: 420 },
  { src: 'https://images.unsplash.com/photo-1510284876186-b1a84b94418f', h: 380 },
]

const REVIEWS = [
  { name: 'Ananya S.', city: 'Mumbai', rating: 5, text: 'The bouquet blanket is a heirloom. Every stitch feels like poetry. I gifted it to my mother and she cried.', avatar: 'https://i.pravatar.cc/120?img=47' },
  { name: 'Priya M.', city: 'Bengaluru', rating: 5, text: 'My potli bag was the star of the wedding. The gold threading is unreal — better than the photos.', avatar: 'https://i.pravatar.cc/120?img=32' },
  { name: 'Ritika V.', city: 'Delhi', rating: 5, text: 'You can tell it is made with patience. The tote is my everyday companion now.', avatar: 'https://i.pravatar.cc/120?img=45' },
  { name: 'Meera K.', city: 'Pune', rating: 5, text: 'Wrapped like a jewel. Made me want to keep the packaging too. Truly premium.', avatar: 'https://i.pravatar.cc/120?img=25' },
  { name: 'Aditi R.', city: 'Hyderabad', rating: 5, text: 'The crochet flowers never wilt. A little bit of colour on my desk that makes every day brighter.', avatar: 'https://i.pravatar.cc/120?img=16' },
]

const PROCESS = [
  { icon: Feather, title: 'Idea', text: 'A quiet spark. A colour, a memory, an occasion.' },
  { icon: Scissors, title: 'Sketch', text: 'The thread finds its shape on paper first.' },
  { icon: Palette, title: 'Crochet', text: 'Hours become days. Every knot is intentional.' },
  { icon: ShieldCheck, title: 'Quality', text: 'Inspected stitch by stitch, thread by thread.' },
  { icon: Package, title: 'Packaging', text: 'Wrapped like the keepsake it is meant to be.' },
  { icon: Truck, title: 'Delivered', text: 'Delivered with love — to your doorstep.' },
]

const WHYS = [
  { icon: Heart, title: '100% Handmade', text: 'Every piece touched only by artisan hands. No machines, no shortcuts.' },
  { icon: Leaf, title: 'Eco-Conscious', text: 'Natural fibres, minimal waste, and packaging you can compost.' },
  { icon: Sparkles, title: 'One of One', text: 'No two SutraKriti creations are ever exactly alike.' },
  { icon: Palette, title: 'Made For You', text: 'Colours, sizes and stories customised to your world.' },
  { icon: Gift, title: 'Perfect for Gifting', text: 'From weddings to birthdays — designed to be unforgettable.' },
  { icon: Award, title: 'Premium Materials', text: 'Certified cotton, merino wool and gold-threaded finishes.' },
]

const FAQS = [
  { q: 'How do I place an order and what is the payment process?', a: 'For collection pieces, tap “Order on WhatsApp” on any product — this opens WhatsApp with your product details pre-filled. For custom orders, fill the Custom Order form (or message us on WhatsApp) with your colours, size, occasion and a reference image. In both cases, after a short discussion about your piece, payment must be made in advance via UPI and/or a secured payment link — details are shared with you on our WhatsApp Business account. Only once payment is confirmed do we reserve materials and either dispatch (collection) or begin crafting (custom).' },
  { q: 'How long does a custom order take?', a: 'Depending on complexity, custom orders typically take 2–4 weeks after payment. We will confirm the exact timeline for your piece before starting.' },
  { q: 'Do you ship internationally?', a: 'Yes, we ship worldwide. International orders take 10–21 business days after dispatch.' },
  { q: 'How should I care for my crochet piece?', a: 'Hand wash in cold water with mild detergent, reshape while damp and dry flat. Avoid direct sunlight.' },
  { q: 'What is your return policy?', a: 'Because every piece is handmade to order, we do not accept returns unless the product is defective. We work with you to make it right.' },
  { q: 'Can I gift-wrap an order?', a: 'Every SutraKriti order is packaged in our signature keepsake box at no extra cost. Personalised notes are complimentary.' },
]

function YarnParticles({ count = 22 }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    setItems(
      Array.from({ length: count }).map((_, i) => {
        const size = 4 + Math.random() * 10
        return {
          i, size,
          left: Math.random() * 100,
          top: 60 + Math.random() * 40,
          dur: 8 + Math.random() * 10,
          delay: Math.random() * 8,
          tx: (Math.random() - 0.5) * 120,
          ty: -(140 + Math.random() * 200),
        }
      })
    )
  }, [count])
  if (items.length === 0) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {items.map(p => (
        <span
          key={p.i}
          className="yarn-particle"
          style={{
            width: p.size, height: p.size,
            left: `${p.left}%`, top: `${p.top}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
          }}
        />
      ))}
    </div>
  )
}

function MorphingWord() {
  const words = ['Thread', 'Flower', 'Handbag', 'Bouquet', 'SutraKriti']
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % words.length), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="relative inline-block align-baseline" style={{ minWidth: '5.5ch' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="italic text-terracotta-dark inline-block"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 500 }}
        >
          {words[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function BrandLogo({ className = '', showText = false }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/brand/sutrakriti-logo.png"
        alt="SutraKriti — handcrafted crochet"
        className="w-auto h-full object-contain"
        draggable={false}
      />
      {showText && <span className="sr-only">SutraKriti</span>}
    </span>
  )
}

function LogoMark({ className = '' }) {
  // Legacy SVG mark, kept for any inline decorative use.
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#B76A4B" />
          <stop offset="1" stopColor="#8F4E36" />
        </linearGradient>
      </defs>
      <path d="M8 32 C 8 16, 24 8, 32 20 S 56 32, 48 44 S 24 60, 16 48 S 8 44, 8 32Z" fill="url(#lg)" opacity="0.9" />
      <path d="M20 28 Q 32 12 44 28 T 44 44 Q 32 56 20 44 T 20 28" fill="none" stroke="#FBF7EE" strokeWidth="1.5" opacity="0.85" />
    </svg>
  )
}

function Nav({ onOpenCustom }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on); return () => window.removeEventListener('scroll', on)
  }, [])
  const items = [
    { label: 'Collections', href: '#collections' },
    { label: 'Story', href: '#story' },
    { label: 'Philosophy', href: '#philosophy' },
    { label: 'Process', href: '#process' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'FAQ', href: '#faq' },
  ]
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'backdrop-blur-md bg-[rgba(247,241,229,0.85)] border-b border-beige' : 'bg-transparent'}`}>
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#top" className="flex items-center" aria-label="SutraKriti home">
          <div className="h-12 md:h-14">
            <BrandLogo className="h-full" />
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {items.map(i => (
            <a key={i.href} href={i.href} className="text-sm tracking-wide text-charcoal/80 link-underline">{i.label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button onClick={onOpenCustom} variant="ghost" className="text-charcoal hover:bg-beige">Custom Order</Button>
          <Button asChild className="btn-luxury bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white rounded-full px-5">
            <a href="#collections">Shop <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-charcoal"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-cream">
            <SheetHeader>
              <SheetTitle className="sr-only">SutraKriti</SheetTitle>
              <div className="h-16"><BrandLogo className="h-full" /></div>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-5">
              {items.map(i => <a key={i.href} href={i.href} className="text-lg text-charcoal">{i.label}</a>)}
              <Button onClick={onOpenCustom} variant="outline" className="mt-4">Custom Order</Button>
              <Button asChild className="bg-terracotta text-white"><a href="#collections">Shop Collection</a></Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

function Hero({ onOpenCustom }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 80, damping: 20 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 80, damping: 20 })
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-20, 20]), { stiffness: 60, damping: 20 })
  const py = useSpring(useTransform(my, [-0.5, 0.5], [-14, 14]), { stiffness: 60, damping: 20 })

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35])

  return (
    <section id="top" ref={ref} onMouseMove={onMove} className="relative min-h-[100svh] w-full overflow-hidden bg-cream noise">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(1200px 600px at 70% 30%, rgba(201,169,97,0.20), transparent 60%), radial-gradient(900px 500px at 20% 80%, rgba(163,177,138,0.22), transparent 60%)'
      }} />
      <YarnParticles count={26} />

      <svg viewBox="0 0 1440 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="thread" x1="0" x2="1">
            <stop offset="0" stopColor="#B76A4B" stopOpacity="0.0" />
            <stop offset="0.5" stopColor="#B76A4B" stopOpacity="0.55" />
            <stop offset="1" stopColor="#8F4E36" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M -50 720 C 200 600, 380 820, 620 620 S 1000 480, 1200 640 S 1500 520, 1600 660"
          fill="none" stroke="url(#thread)" strokeWidth="2.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3.2, ease: 'easeOut' }}
        />
        <motion.path
          d="M 60 200 C 260 320, 460 120, 720 260 S 1160 320, 1360 200"
          fill="none" stroke="url(#thread)" strokeWidth="1.4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 3.6, delay: 0.4, ease: 'easeOut' }}
        />
      </svg>

      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container relative z-10 pt-32 md:pt-40 pb-16 md:pb-24 grid md:grid-cols-12 gap-8 md:gap-12 items-center min-h-[100svh]">
        <div className="md:col-span-7">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-beige bg-ivory/70 backdrop-blur px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-brown">
              <Sparkles className="h-3.5 w-3.5 text-terracotta" /> Handcrafted • Small Batch • India
            </span>
          </motion.div>
          <motion.h1
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.15 }}
            className="mt-6 font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.98] text-charcoal"
          >
            Every <MorphingWord /><br />
            <span className="italic text-brown">tells a story.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-6 max-w-xl text-base md:text-lg text-charcoal/70 leading-relaxed"
          >
            SutraKriti is a boutique of handcrafted crochet — bags, blankets, blooms and heirloom gifts, made slowly, thread by thread, by artisan hands.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.75 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="btn-luxury rounded-full bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white px-7 h-12 text-sm tracking-wide">
              <a href="#collections">Explore Collection <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button onClick={onOpenCustom} size="lg" variant="outline" className="rounded-full border-charcoal/20 text-charcoal hover:bg-beige h-12 px-7">
              Custom Order
            </Button>
            <a href="#story" className="ml-2 text-sm text-charcoal/60 link-underline flex items-center gap-1">Scroll the story <ChevronDown className="h-4 w-4" /></a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}
            className="mt-10 flex items-center gap-6 text-xs tracking-[0.2em] uppercase text-charcoal/50"
          >
            <span>Slow Fashion</span><span className="opacity-40">·</span><span>Handmade</span><span className="opacity-40">·</span><span>Made in India</span>
          </motion.div>
        </div>

        <motion.div style={{ rotateX: rx, rotateY: ry }} className="md:col-span-5 relative aspect-[4/5] md:aspect-[3/4]">
          <motion.div style={{ x: px, y: py }} className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(109,76,54,0.35)] ring-1 ring-black/5">
            <img src="https://images.unsplash.com/photo-1539215398023-f3ac3405795f?w=1200&q=85" alt="Handcrafted crochet yarn arrangement" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase opacity-80">Signature</div>
                <div className="font-serif text-2xl">Bouquet Blanket</div>
              </div>
              <a href="#collections" className="inline-flex items-center gap-1 text-sm bg-white/15 backdrop-blur border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/25">
                View <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="absolute -left-6 md:-left-10 top-8 bg-ivory border border-beige rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-terracotta/15 flex items-center justify-center"><Heart className="h-4 w-4 text-terracotta" /></div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50">Loved by</div>
              <div className="text-sm text-charcoal">1200+ customers</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
            className="absolute -right-4 md:-right-8 bottom-10 bg-ivory border border-beige rounded-2xl shadow-xl px-4 py-3"
          >
            <div className="flex items-center gap-1 text-gold">{Array.from({length:5}).map((_,i)=><Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
            <div className="text-xs text-charcoal/70 mt-1">Rated 4.9 by artisans & guests</div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-charcoal/40 text-xs tracking-[0.3em]">SCROLL</div>
    </section>
  )
}

function TrustMarquee() {
  const items = ['· Handmade in India', '· Since 2021', '· One-of-a-kind pieces', '· Wedding & Gifting', '· Natural fibres', '· Slow fashion', '· Made with love', '· Featured on Instagram']
  const row = [...items, ...items]
  return (
    <div className="relative py-6 border-y border-beige bg-ivory/60 overflow-hidden">
      <div className="marquee-track text-charcoal/60 text-sm tracking-[0.2em] uppercase whitespace-nowrap">
        {row.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  )
}

function PhilosophySparkles() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const r = 46
        const left = (50 + Math.cos(angle) * r).toFixed(4)
        const top = (50 + Math.sin(angle) * r).toFixed(4)
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
            className="absolute h-1.5 w-1.5 rounded-full bg-terracotta/70"
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        )
      })}
    </>
  )
}

function PhilosophySection() {
  return (
    <section id="philosophy" className="relative py-24 md:py-32 bg-beige/60 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{
        background: 'radial-gradient(700px 380px at 15% 30%, rgba(201,169,97,0.18), transparent 60%), radial-gradient(700px 380px at 85% 70%, rgba(183,106,75,0.14), transparent 60%)'
      }} />
      <div className="container relative z-10 grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9 }} className="md:col-span-6"
        >
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Our Philosophy</span>
          <h2 className="mt-3 font-serif text-4xl md:text-6xl leading-[1.02] text-charcoal">
            Handmade <span className="italic text-brown">with purpose.</span>
          </h2>
          <p className="mt-6 text-charcoal/75 text-lg leading-relaxed max-w-xl">
            We believe meaningful things take time. That is why every SutraKriti creation is made <em className="not-italic text-terracotta">carefully</em>, rather than quickly.
          </p>
          <p className="mt-4 text-charcoal/70 leading-relaxed max-w-xl">
            Each piece is crafted to celebrate creativity, quality, and individuality — offering something that feels personal rather than mass-produced.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Slow', 'Intentional', 'Personal', 'Never Mass-Produced'].map(t => (
              <span key={t} className="text-[11px] tracking-[0.2em] uppercase text-charcoal/70 border border-charcoal/15 rounded-full px-3 py-1 bg-cream/70">{t}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className="md:col-span-6 relative"
        >
          <div className="relative mx-auto max-w-md aspect-square">
            {/* Decorative concentric rings echoing the logo's mandala */}
            <div className="absolute inset-0 rounded-full border border-terracotta/25" />
            <div className="absolute inset-4 rounded-full border border-terracotta/20" />
            <div className="absolute inset-10 rounded-full border border-terracotta/15" />
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle at 50% 45%, rgba(251,247,238,0.9), rgba(233,221,199,0.5) 70%, transparent 90%)'
            }} />
            <img
              src="/brand/sutrakriti-logo.png"
              alt="SutraKriti mandala"
              className="absolute inset-6 md:inset-10 w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] h-[calc(100%-3rem)] md:h-[calc(100%-5rem)] object-contain drop-shadow-[0_20px_40px_rgba(109,76,54,0.25)]"
            />
            {/* Tiny sparkles orbiting (client-only to avoid float-point hydration mismatch) */}
            <PhilosophySparkles />
          </div>
          <div className="mt-6 text-center text-[11px] tracking-[0.3em] uppercase text-charcoal/50">— Every thread, intentional —</div>
        </motion.div>
      </div>
    </section>
  )
}

function StorySection() {
  return (
    <section id="story" className="relative py-24 md:py-32 bg-cream">
      <div className="container grid md:grid-cols-12 gap-10 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }}
          className="md:col-span-5 md:sticky md:top-28 self-start"
        >
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Our Story</span>
          <h2 className="mt-4 font-serif text-4xl md:text-6xl leading-[1.02] text-charcoal">A brand born<br /><span className="italic text-brown">between the threads.</span></h2>
          <p className="mt-6 text-charcoal/70 leading-relaxed">
            SutraKriti began in a small room, with a single ball of yarn and a lot of patience.
            What started as my mother’s quiet ritual became her devotion — to the slow, to the handmade, to the beautiful things that take time.
          </p>
          <p className="mt-4 text-charcoal/70 leading-relaxed">
            Every SutraKriti piece is handcrafted by my mother, one stitch at a time. Every knot holds her patience. Every colour, her choice.
            Every creation is a quiet conversation between her hands and the thread — which is why no two are ever exactly alike.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <div>
              <div className="font-serif text-3xl text-terracotta">1200+</div>
              <div className="text-xs tracking-widest uppercase text-charcoal/50">Happy homes</div>
            </div>
            <div className="w-px h-10 bg-beige" />
            <div>
              <div className="font-serif text-3xl text-terracotta">40+</div>
              <div className="text-xs tracking-widest uppercase text-charcoal/50">Signature designs</div>
            </div>
            <div className="w-px h-10 bg-beige" />
            <div>
              <div className="font-serif text-3xl text-terracotta">100%</div>
              <div className="text-xs tracking-widest uppercase text-charcoal/50">Handmade</div>
            </div>
          </div>
        </motion.div>

        <div className="md:col-span-7 space-y-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="rounded-[2rem] overflow-hidden aspect-[4/3] shadow-xl">
            <img src="https://images.pexels.com/photos/36238478/pexels-photo-36238478.jpeg" alt="Artisan hands crocheting yarn" className="w-full h-full object-cover" />
          </motion.div>
          <div className="grid grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }} className="rounded-[1.5rem] overflow-hidden aspect-[3/4]">
              <img src="https://images.unsplash.com/photo-1648005539099-709d5be525fb?w=900&q=85" alt="Balls of yarn with wooden crochet hook resting on soft blanket" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="rounded-[1.5rem] overflow-hidden aspect-[3/4] mt-8">
              <img src="https://images.pexels.com/photos/37540169/pexels-photo-37540169.jpeg?w=900" alt="Delicate crochet piece with wildflowers on floral fabric" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Collections({ products, onView }) {
  const featured = products.slice(0, 6)
  return (
    <section id="collections" className="relative py-24 md:py-32 bg-ivory">
      <div className="container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Featured Collections</span>
            <h2 className="mt-3 font-serif text-4xl md:text-6xl text-charcoal leading-tight">Made slowly.<br /><span className="italic text-brown">Loved forever.</span></h2>
          </div>
          <a href="#catalogue" className="hidden md:inline-flex items-center gap-2 text-sm text-charcoal link-underline">Browse full catalogue <ArrowRight className="h-4 w-4" /></a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-5 md:gap-6">
          {featured.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.06 }}
              onClick={() => onView(p)}
              className={`luxury-card group relative overflow-hidden rounded-[1.75rem] bg-cream text-left w-full aspect-square ${i === 0 ? 'sm:col-span-2 md:col-span-4 md:row-span-2 md:aspect-[16/13]' : 'md:col-span-2'}`}
            >
              <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              {p.bestseller && <Badge className="absolute top-4 left-4 bg-terracotta text-white border-0">Bestseller</Badge>}
              {p.new && <Badge className="absolute top-4 left-4 bg-sage text-white border-0">New</Badge>}
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-white flex items-end justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase opacity-80">{p.category}</div>
                  <div className="font-serif text-2xl md:text-3xl mt-1">{p.name}</div>
                  <div className="mt-1 text-sm opacity-90">₹{p.price.toLocaleString('en-IN')}</div>
                </div>
                <span className="h-10 w-10 rounded-full bg-white/15 border border-white/30 backdrop-blur flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Catalogue({ products, onView }) {
  const [cat, setCat] = useState('All')
  const filtered = cat === 'All' ? products : products.filter(p => p.category === cat)
  return (
    <section id="catalogue" className="py-24 md:py-32 bg-cream">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">The Boutique</span>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl text-charcoal">Shop the collection</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-4 py-2 text-xs tracking-widest uppercase border transition ${cat === c ? 'bg-charcoal text-cream border-charcoal' : 'bg-transparent text-charcoal/70 border-beige hover:border-charcoal/40'}`}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onView(p)}
              className="group text-left"
            >
              <div className="relative overflow-hidden rounded-[1.25rem] aspect-[4/5] bg-beige">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex gap-1">
                  {p.new && <Badge className="bg-sage text-white border-0">New</Badge>}
                  {p.bestseller && <Badge className="bg-terracotta text-white border-0">Bestseller</Badge>}
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/90 text-charcoal">Quick View</span>
                  <span className="h-8 w-8 rounded-full bg-terracotta text-white flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></span>
                </div>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50">{p.category}</div>
                  <div className="font-serif text-lg text-charcoal">{p.name}</div>
                </div>
                <div className="font-serif text-lg text-terracotta whitespace-nowrap">₹{p.price.toLocaleString('en-IN')}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhySection() {
  return (
    <section className="py-24 md:py-32 bg-ivory">
      <div className="container">
        <div className="max-w-2xl">
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Why SutraKriti</span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-charcoal">The details you feel,<br /><span className="italic text-brown">before you see.</span></h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-5 md:gap-6">
          {WHYS.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="luxury-card group relative rounded-[1.5rem] p-8 bg-cream border border-beige overflow-hidden"
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-terracotta/10 group-hover:bg-terracotta/15 transition-colors" />
              <w.icon className="h-7 w-7 text-terracotta" />
              <div className="mt-5 font-serif text-2xl text-charcoal">{w.title}</div>
              <p className="mt-2 text-charcoal/70 leading-relaxed">{w.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Personalisation({ onOpenCustom }) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1571434976902-a6e3e1eb0d51?w=1600&q=85" alt="Handcrafted crochet" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(115deg, rgba(247,241,229,0.96) 0%, rgba(247,241,229,0.92) 45%, rgba(233,221,199,0.78) 100%)'
        }} />
      </div>
      <div className="container relative z-10 text-charcoal">
        <div className="max-w-3xl">
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Personalisation</span>
          <h2 className="mt-3 font-serif text-4xl md:text-6xl leading-[1.05] text-charcoal">Make it yours.<br /><span className="italic text-brown">Made only for you.</span></h2>
          <p className="mt-5 text-charcoal/75 max-w-xl leading-relaxed">
            Choose your colours, dimensions, and story. We create wedding gifts, baby heirlooms, corporate keepsakes and everything in between — one thread at a time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onOpenCustom} size="lg" className="btn-luxury rounded-full bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white px-7 h-12">
              Start a Custom Order <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-12 border-charcoal/25 bg-transparent text-charcoal hover:bg-charcoal hover:text-cream">
              <a target="_blank" rel="noreferrer" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi SutraKriti, I would like a custom crochet piece.')}`}>Chat on WhatsApp <MessageCircle className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl text-charcoal/80">
            {['Wedding Gifts', 'Baby Gifts', 'Corporate Gifts', 'Festival Gifts'].map(x => (
              <div key={x} className="border-t border-charcoal/20 pt-3 text-sm tracking-wider uppercase">{x}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProcessSection() {
  return (
    <section id="process" className="py-24 md:py-32 bg-cream">
      <div className="container">
        <div className="max-w-2xl">
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">The Process</span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-charcoal">From thread <span className="italic text-brown">to treasure.</span></h2>
        </div>
        <div className="mt-14 relative">
          <div className="hidden md:block absolute top-8 left-0 right-0 divider-thread" />
          <div className="grid md:grid-cols-6 gap-8">
            {PROCESS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="relative"
              >
                <div className="mx-auto md:mx-0 h-16 w-16 rounded-full bg-ivory border border-beige flex items-center justify-center shadow-sm">
                  <s.icon className="h-6 w-6 text-terracotta" />
                </div>
                <div className="mt-5 text-center md:text-left">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-charcoal/50">Step 0{i + 1}</div>
                  <div className="font-serif text-xl text-charcoal mt-1">{s.title}</div>
                  <p className="text-sm text-charcoal/70 mt-1 leading-relaxed">{s.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Reviews() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % REVIEWS.length), 5000)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="py-24 md:py-32 bg-beige/50">
      <div className="container">
        <div className="max-w-2xl">
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Kind Words</span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-charcoal">Loved by the people <span className="italic text-brown">who receive them.</span></h2>
        </div>
        <div className="mt-12 relative">
          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.7 }}
                className="max-w-3xl"
              >
                <div className="flex items-center gap-1 text-gold">{Array.from({length: REVIEWS[i].rating}).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
                <p className="mt-4 font-serif text-2xl md:text-3xl leading-snug text-charcoal">“{REVIEWS[i].text}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <img src={REVIEWS[i].avatar} alt={REVIEWS[i].name} className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <div className="text-sm text-charcoal">{REVIEWS[i].name}</div>
                    <div className="text-xs text-charcoal/50 tracking-wider uppercase">{REVIEWS[i].city}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex gap-2">
            {REVIEWS.map((_, k) => (
              <button key={k} onClick={() => setI(k)} className={`h-1 w-8 rounded-full transition ${k === i ? 'bg-terracotta' : 'bg-charcoal/15'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Gallery() {
  const [open, setOpen] = useState(null)
  return (
    <section id="gallery" className="py-24 md:py-32 bg-ivory">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Gallery</span>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl text-charcoal">Woven moments.</h2>
          </div>
          <a href={IG_URL} target="_blank" rel="noreferrer" className="hidden md:inline-flex items-center gap-2 text-sm text-charcoal link-underline">
            <Instagram className="h-4 w-4" /> @_sutrakriti
          </a>
        </div>
        <div className="masonry">
          {GALLERY.map((g, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.04 }}
              onClick={() => setOpen(g.src)}
              className="group block w-full overflow-hidden rounded-2xl relative"
            >
              <img src={g.src} alt="SutraKriti gallery" loading="lazy" decoding="async" style={{ height: g.h }} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
      <Dialog open={!!open} onOpenChange={() => setOpen(null)}>
        <DialogContent className="max-w-3xl bg-cream border-beige p-2">
          {open && <img src={open} alt="Preview" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function FaqSection() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-cream">
      <div className="container grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">FAQ</span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-charcoal">Little questions,<br /><span className="italic text-brown">honest answers.</span></h2>
          <p className="mt-6 text-charcoal/70">Can’t find what you need? WhatsApp us — we reply quickly and personally.</p>
          <Button asChild className="mt-6 bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white rounded-full">
            <a target="_blank" rel="noreferrer" href={`https://wa.me/${WHATSAPP_NUMBER}`}>Message on WhatsApp <MessageCircle className="ml-2 h-4 w-4" /></a>
          </Button>
        </div>
        <div className="md:col-span-8">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`i-${i}`} className="border-beige">
                <AccordionTrigger className="text-left font-serif text-xl text-charcoal hover:text-terracotta py-6">{f.q}</AccordionTrigger>
                <AccordionContent className="text-charcoal/70 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!email) return
    setBusy(true)
    try {
      const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (r.ok) { toast.success('Welcome to SutraKriti.'); setEmail('') }
      else toast.error('Something went wrong. Try again.')
    } finally { setBusy(false) }
  }
  return (
    <section className="py-16 bg-beige/60">
      <div className="container grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-6">
          <h3 className="font-serif text-3xl md:text-4xl text-charcoal">Join the thread.</h3>
          <p className="text-charcoal/70 mt-2">Slow letters. New arrivals. Behind-the-scenes from the studio. No noise.</p>
        </div>
        <form onSubmit={submit} className="md:col-span-6 flex gap-2">
          <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="you@address.com" className="h-12 bg-cream border-beige rounded-full px-5" />
          <Button disabled={busy} className="h-12 rounded-full px-6 bg-charcoal hover:bg-black text-cream">{busy ? '…' : 'Subscribe'} <Send className="ml-2 h-4 w-4" /></Button>
        </form>
      </div>
    </section>
  )
}

function Footer({ onOpenCustom }) {
  return (
    <footer className="bg-[color:var(--sk-charcoal)] text-cream/85">
      <div className="container py-16 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="h-20 md:h-24 -ml-2 brightness-110">
            <BrandLogo className="h-full" />
          </div>
          <p className="mt-4 max-w-md text-white/70">Handcrafted crochet, woven with love. Every thread tells a story. Every creation is a masterpiece.</p>
          <div className="mt-6 flex items-center gap-4 text-white/90">
            <a href={IG_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm link-underline"><Instagram className="h-4 w-4" /> @_sutrakriti</a>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 text-sm link-underline"><Mail className="h-4 w-4" /> {EMAIL}</a>
          </div>
        </div>
        <div className="md:col-span-3 text-white/85">
          <div className="text-xs tracking-[0.3em] uppercase text-white/50">Shop</div>
          <ul className="mt-4 space-y-2">
            <li><a href="#collections" className="link-underline">Featured</a></li>
            <li><a href="#catalogue" className="link-underline">Full Catalogue</a></li>
            <li><button onClick={onOpenCustom} className="link-underline">Custom Order</button></li>
            <li><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="link-underline">Order via WhatsApp</a></li>
          </ul>
        </div>
        <div className="md:col-span-4 text-white/85">
          <div className="text-xs tracking-[0.3em] uppercase text-white/50">Studio</div>
          <ul className="mt-4 space-y-2">
            <li><a href="#story" className="link-underline">Our Story</a></li>
            <li><a href="#process" className="link-underline">Process</a></li>
            <li><a href="#faq" className="link-underline">FAQ</a></li>
            <li>Made in India · Delivered worldwide</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>© {new Date().getFullYear()} SutraKriti. All rights reserved.</span>
          <span className="tracking-widest">HANDMADE · SLOW · WITH LOVE</span>
        </div>
      </div>
    </footer>
  )
}

function Info({ label, value }) {
  return (
    <div className="border-t border-beige pt-2">
      <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50">{label}</div>
      <div className="text-sm text-charcoal">{value}</div>
    </div>
  )
}

function ProductGallery({ images, name }) {
  const list = images && images.length ? images : []
  const [idx, setIdx] = useState(0)
  useEffect(() => { setIdx(0) }, [images])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % list.length)
      else if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + list.length) % list.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list.length])
  if (!list.length) return null
  const prev = () => setIdx(i => (i - 1 + list.length) % list.length)
  const next = () => setIdx(i => (i + 1) % list.length)

  return (
    <div className="relative w-full h-full bg-beige/40 select-none">
      <div className="relative w-full aspect-square md:aspect-auto md:h-full overflow-hidden">
        <motion.div
          key={idx}
          drag={list.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) next()
            else if (info.offset.x > 60) prev()
          }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          role="img"
          aria-label={`${name} — image ${idx + 1} of ${list.length}`}
        >
          <img
            src={list[idx]}
            alt={`${name} — ${idx + 1}`}
            draggable={false}
            loading="eager"
            className="w-full h-full object-cover pointer-events-none"
          />
        </motion.div>
      </div>

      {list.length > 1 && (
        <>
          <button
            type="button" onClick={prev} aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white shadow-lg text-charcoal flex items-center justify-center backdrop-blur"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button" onClick={next} aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white shadow-lg text-charcoal flex items-center justify-center backdrop-blur"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {list.map((_, i) => (
              <button
                key={i} type="button" onClick={() => setIdx(i)} aria-label={`Show image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 text-[11px] tracking-widest uppercase bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur">
            {idx + 1} / {list.length}
          </div>
        </>
      )}
    </div>
  )
}

function ProductModal({ product, open, onClose, onCustom }) {
  const [busy, setBusy] = useState(false)
  if (!product) return null
  const buyEnabled = (process.env.NEXT_PUBLIC_BUY_NOW_ENABLED || 'false').toLowerCase() === 'true'
  const buyNow = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/razorpay/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) })
      if (r.status === 503) {
        toast.message('Online payment is being set up. Opening WhatsApp for direct order.')
        const priceStr = `\u20b9${Number(product.price).toLocaleString('en-IN')}`
        const colours = product.colors?.length ? `\nColours: ${product.colors.join(', ')}` : ''
        const t = `Hello SutraKriti, I would like to order the following piece from your collection:

\u2022 Product: ${product.name}
\u2022 Category: ${product.category}
\u2022 Price: ${priceStr}${colours}
\u2022 Reference: ${product.id}

Could you please confirm:
1) Availability of this piece
2) A secured payment link / UPI details
3) Expected delivery time to my location

Thank you!`
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`, '_blank')
        return
      }
      const data = await r.json()
      if (!r.ok) { toast.error(data?.error || 'Payment error'); return }
      const opts = {
        key: data.keyId, amount: data.amount, currency: data.currency,
        name: 'SutraKriti', description: data.product.name, image: data.product.image, order_id: data.orderId,
        theme: { color: '#B76A4B' },
        handler: async (resp) => {
          const v = await fetch('/api/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resp) })
          const j = await v.json()
          if (j.ok) toast.success('Payment successful — we will be in touch shortly.')
          else toast.error('Payment verification failed. Please try again or contact us.')
        },
      }
      const rzp = new window.Razorpay(opts)
      rzp.open()
    } catch (e) {
      toast.error('Something went wrong.')
    } finally { setBusy(false) }
  }
  const orderWhats = () => {
    const priceStr = `\u20b9${Number(product.price).toLocaleString('en-IN')}`
    const colours = product.colors?.length ? `\nColours: ${product.colors.join(', ')}` : ''
    const t = `Hello SutraKriti, I would like to order the following piece from your collection:

\u2022 Product: ${product.name}
\u2022 Category: ${product.category}
\u2022 Price: ${priceStr}${colours}
\u2022 Reference: ${product.id}

Could you please confirm:
1) Availability of this piece
2) A secured payment link / UPI details
3) Expected delivery time to my location

Thank you!`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-cream border-beige p-0 overflow-hidden max-h-[92vh] md:max-h-[88vh] flex flex-col">
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid md:grid-cols-2">
            <div className="relative md:sticky md:top-0 md:h-[88vh] md:max-h-full">
              <ProductGallery images={product.images && product.images.length ? product.images : [product.image]} name={product.name} />
            </div>
            <div className="p-6 md:p-8">
              <div className="text-[10px] tracking-[0.3em] uppercase text-terracotta">{product.category}</div>
              <DialogHeader className="mt-2 p-0">
                <DialogTitle className="font-serif text-3xl text-charcoal text-left">{product.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-1 font-serif text-2xl text-terracotta">₹{product.price.toLocaleString('en-IN')}</div>
              <p className="mt-4 text-charcoal/70 leading-relaxed">{product.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Info label="Material" value={product.material} />
                <Info label="Dimensions" value={product.dimensions} />
                <Info label="Care" value={product.care} />
                <Info label="Delivery" value={product.delivery} />
              </div>
              {product.colors?.length ? (
                <div className="mt-5">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50">Available in</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.colors.map(c => <span key={c} className="text-xs rounded-full border border-beige px-3 py-1 bg-ivory">{c}</span>)}
                  </div>
                </div>
              ) : null}
              <div className="mt-7 flex flex-col sm:flex-row gap-2">
                {buyEnabled && (
                  <Button onClick={buyNow} disabled={busy} className="btn-luxury bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white rounded-full h-11 flex-1">
                    {busy ? 'Opening…' : 'Buy Now'} <ShoppingBag className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button onClick={orderWhats} className={`rounded-full h-11 flex-1 ${buyEnabled ? 'bg-transparent border border-charcoal/20 text-charcoal hover:bg-beige' : 'btn-luxury bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white'}`}>
                  Order on WhatsApp <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {!buyEnabled && (
                <div className="mt-2 text-[11px] text-charcoal/50 tracking-wide">
                  Online checkout coming soon. For now, orders are placed via WhatsApp.
                </div>
              )}
              <button onClick={() => { onClose(); onCustom() }} className="mt-4 text-sm text-charcoal/70 link-underline">Want it in a different colour or size? Request a custom piece →</button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CustomOrderModal({ open, onClose }) {
  const [form, setForm] = useState({ name: '', contact: '', email: '', productType: '', colors: '', size: '', budget: '', occasion: '', referenceImage: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.contact) { toast.error('Name and contact required'); return }
    if (!form.email) { toast.error('Email is required — we will send you an acknowledgement.'); return }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { toast.error('Please enter a valid email address.'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/custom-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (r.ok) {
        const j = await r.json().catch(() => ({}))
        if (j.customerEmailStatus === 'sent') {
          toast.success('Enquiry received. Check your inbox for our acknowledgement — we will reach out within 24 hours.')
        } else {
          toast.success('Enquiry received. We will reach out within 24 hours.')
        }
        onClose()
        setForm({ name: '', contact: '', email: '', productType: '', colors: '', size: '', budget: '', occasion: '', referenceImage: '', notes: '' })
      } else toast.error('Something went wrong.')
    } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-cream border-beige p-0 max-h-[92vh] md:max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-7">
          <DialogHeader className="text-left">
            <div className="text-[10px] tracking-[0.3em] uppercase text-terracotta">Personalisation</div>
            <DialogTitle className="font-serif text-2xl md:text-3xl text-charcoal">Start a custom order</DialogTitle>
            <DialogDescription className="text-charcoal/70">Tell us what you dream of. We reply within 24 hours with a design proposal.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} id="custom-order-form" className="mt-5 grid md:grid-cols-2 gap-3">
            <Input required placeholder="Your name *" value={form.name} onChange={e=>set('name', e.target.value)} className="bg-ivory border-beige" />
            <Input required placeholder="Phone / WhatsApp *" value={form.contact} onChange={e=>set('contact', e.target.value)} className="bg-ivory border-beige" />
            <Input required placeholder="Email * (we will send you an acknowledgement)" type="email" value={form.email} onChange={e=>set('email', e.target.value)} className="bg-ivory border-beige md:col-span-2" />
            <Input placeholder="Product type (e.g. potli, bouquet, blanket)" value={form.productType} onChange={e=>set('productType', e.target.value)} className="bg-ivory border-beige" />
            <Input placeholder="Occasion (wedding, baby, corporate…)" value={form.occasion} onChange={e=>set('occasion', e.target.value)} className="bg-ivory border-beige" />
            <Input placeholder="Colour preferences" value={form.colors} onChange={e=>set('colors', e.target.value)} className="bg-ivory border-beige" />
            <Input placeholder="Size / dimensions" value={form.size} onChange={e=>set('size', e.target.value)} className="bg-ivory border-beige" />
            <Input placeholder="Budget (INR)" value={form.budget} onChange={e=>set('budget', e.target.value)} className="bg-ivory border-beige" />
            <Input placeholder="Reference image URL (optional)" value={form.referenceImage} onChange={e=>set('referenceImage', e.target.value)} className="bg-ivory border-beige" />
            <Textarea placeholder="Additional notes, personalisation, dates…" value={form.notes} onChange={e=>set('notes', e.target.value)} className="bg-ivory border-beige md:col-span-2 min-h-[110px]" />
          </form>
        </div>
        <DialogFooter className="p-4 md:p-5 bg-cream border-t border-beige flex-shrink-0 gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} type="submit" form="custom-order-form"
                  className="bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white rounded-full">
            {busy ? 'Sending…' : 'Send Enquiry'} <Send className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FloatingCTA({ onOpenCustom }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500)
    on(); window.addEventListener('scroll', on); return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className={`fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <button onClick={onOpenCustom}
              className="inline-flex items-center gap-2 rounded-full bg-charcoal text-cream px-3.5 py-2 md:px-4 md:py-2.5 shadow-lg hover:bg-black text-xs md:text-sm">
        <Sparkles className="h-4 w-4" /> Custom Order
      </button>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi SutraKriti!')}`} target="_blank" rel="noreferrer"
         className="h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [viewing, setViewing] = useState(null)
  const [customOpen, setCustomOpen] = useState(false)

  useEffect(() => {
    fetch('/api/products').then(r=>r.json()).then(d => setProducts(d.products || [])).catch(()=>{})
  }, [])

  return (
    <div className="relative">
      <Toaster position="top-center" richColors closeButton />
      <Nav onOpenCustom={() => setCustomOpen(true)} />
      <Hero onOpenCustom={() => setCustomOpen(true)} />
      <TrustMarquee />
      <StorySection />
      <PhilosophySection />
      <Collections products={products} onView={setViewing} />
      <Catalogue products={products} onView={setViewing} />
      <WhySection />
      <Personalisation onOpenCustom={() => setCustomOpen(true)} />
      <ProcessSection />
      <Reviews />
      <Gallery />
      <FaqSection />
      <Newsletter />
      <Footer onOpenCustom={() => setCustomOpen(true)} />

      <ProductModal product={viewing} open={!!viewing} onClose={() => setViewing(null)} onCustom={() => setCustomOpen(true)} />
      <CustomOrderModal open={customOpen} onClose={() => setCustomOpen(false)} />
      <FloatingCTA onOpenCustom={() => setCustomOpen(true)} />
    </div>
  )
}

export default App
