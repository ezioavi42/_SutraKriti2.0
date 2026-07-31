'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import {
  LogOut, RefreshCw, Search, CheckCircle2, Clock, Send, Mail, Trash2, Copy,
  Image as ImageIcon, Users, MessageSquare, CreditCard, ClipboardList, Undo2,
  ExternalLink, StickyNote, ShieldCheck, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtSize = (b) => !b ? '—' : b < 1024 ? `${b} B` : b < 1e6 ? `${(b/1024).toFixed(1)} KB` : `${(b/1e6).toFixed(2)} MB`

function StatusBadge({ status }) {
  const map = {
    new:       { label: 'New',       className: 'bg-sage/25 text-sage-dark border border-sage/40 text-charcoal' },
    accepted:  { label: 'Accepted',  className: 'bg-terracotta/15 text-terracotta-dark border border-terracotta/40' },
    completed: { label: 'Completed', className: 'bg-charcoal text-cream border-0' },
  }
  const c = map[status] || map.new
  return <Badge className={`${c.className} rounded-full px-2.5 py-0.5 text-[10px] tracking-widest uppercase`}>{c.label}</Badge>
}

/* ---------- Login gate ---------- */
function LoginCard({ onAuth }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (r.ok) { toast.success('Welcome back.'); onAuth() }
      else if (r.status === 401) toast.error('Invalid password.')
      else toast.error('Login failed.')
    } finally { setBusy(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream noise px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="h-14 mx-auto"><img src="/brand/sutrakriti-logo.png" alt="SutraKriti" className="h-full w-auto mx-auto" /></div>
          <div className="mt-4 text-[11px] tracking-[0.3em] uppercase text-terracotta">Studio Access</div>
          <h1 className="font-serif text-3xl text-charcoal mt-1">The Atelier</h1>
        </div>
        <Card className="bg-ivory border-beige shadow-xl">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-charcoal flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-terracotta" /> Sign in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Input type="password" required placeholder="Admin password"
                     value={password} onChange={e=>setPassword(e.target.value)}
                     className="bg-cream border-beige h-11" autoFocus />
              <Button disabled={busy} type="submit"
                      className="w-full h-11 bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white rounded-full">
                {busy ? 'Signing in…' : 'Enter the studio'} <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <div className="mt-5 text-xs text-charcoal/50 leading-relaxed">
              Password protected. Rotate <code className="text-terracotta">ADMIN_PASSWORD</code> in <code>.env</code> to change access.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ---------- Order details / actions dialog ---------- */
function OrderDialog({ order, onClose, onUpdated }) {
  const [note, setNote] = useState(order?.admin_note || '')
  const [timeline, setTimeline] = useState('2–4 weeks (we will confirm on WhatsApp)')
  const [sendEmail, setSendEmail] = useState(true)
  const [busy, setBusy] = useState(false)
  if (!order) return null

  const act = async (action) => {
    setBusy(true)
    try {
      const r = await fetch(`/api/admin/custom-orders/${order.id}/action`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note, timeline, sendEmail })
      })
      const j = await r.json()
      if (!r.ok) { toast.error(j?.error || 'Action failed'); return }
      if (action === 'accept') {
        if (j.emailStatus === 'sent') toast.success('Order accepted and acceptance email sent.')
        else if (j.emailStatus === 'no_email') toast.info('Order accepted. No customer email on file — please contact via WhatsApp.')
        else if (j.emailStatus === 'smtp_not_configured') toast.warning('Order accepted. SMTP not configured — email skipped.')
        else if (j.emailStatus === 'failed') toast.error('Order accepted, but email failed to send.')
        else toast.success('Order accepted.')
      } else if (action === 'complete') toast.success('Order marked as completed.')
      else if (action === 'reopen') toast.success('Order reopened.')
      else if (action === 'note') toast.success('Note saved.')
      onUpdated?.(j.order); onClose()
    } finally { setBusy(false) }
  }

  const wa = order.contact ? `https://wa.me/${String(order.contact).replace(/[^0-9]/g, '')}` : null

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-cream border-beige">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-terracotta">
            Custom Order · <StatusBadge status={order.status} />
          </div>
          <DialogTitle className="font-serif text-2xl text-charcoal">{order.name}</DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Received {fmt(order.created_at)}{order.accepted_at ? ` · Accepted ${fmt(order.accepted_at)}` : ''}
            {order.completed_at ? ` · Completed ${fmt(order.completed_at)}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            ['Contact', order.contact],
            ['Email', order.email || '—'],
            ['Product Type', order.product_type || '—'],
            ['Occasion', order.occasion || '—'],
            ['Colours', order.colors || '—'],
            ['Size', order.size || '—'],
            ['Budget', order.budget || '—'],
            ['Reference', order.reference_image ? <a href={order.reference_image} target="_blank" rel="noreferrer" className="text-terracotta inline-flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></a> : '—'],
          ].map(([k, v]) => (
            <div key={k} className="border-t border-beige pt-2">
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50">{k}</div>
              <div className="text-charcoal">{v}</div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mt-3 rounded-lg bg-ivory border border-beige p-3">
            <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Customer notes</div>
            <div className="text-sm text-charcoal whitespace-pre-wrap">{order.notes}</div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Studio note (included in acceptance email)</div>
          <Textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note to the customer…" className="bg-ivory border-beige min-h-[80px]" />
        </div>
        <div className="mt-3 grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Estimated timeline</div>
            <Input value={timeline} onChange={e=>setTimeline(e.target.value)} className="bg-ivory border-beige" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-charcoal/80 select-none">
            <input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" />
            Send acceptance email
          </label>
        </div>

        {order.acceptance_email_sent_at && (
          <div className="mt-3 text-xs text-charcoal/60 inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Acceptance email sent {fmt(order.acceptance_email_sent_at)}
          </div>
        )}

        <DialogFooter className="mt-4 flex-wrap gap-2">
          {wa && <Button asChild variant="outline" className="rounded-full border-charcoal/20"><a href={wa} target="_blank" rel="noreferrer">Open WhatsApp <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
          <Button onClick={() => act('note')} disabled={busy} variant="ghost"><StickyNote className="mr-2 h-4 w-4" /> Save Note</Button>
          {order.status === 'accepted' && (
            <Button onClick={() => act('reopen')} disabled={busy} variant="outline" className="rounded-full">
              <Undo2 className="mr-2 h-4 w-4" /> Reopen
            </Button>
          )}
          {order.status !== 'completed' && (
            <Button onClick={() => act('complete')} disabled={busy} className="rounded-full bg-charcoal hover:bg-black text-cream">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
            </Button>
          )}
          {order.status !== 'accepted' && order.status !== 'completed' && (
            <Button onClick={() => act('accept')} disabled={busy} className="rounded-full bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white">
              <Send className="mr-2 h-4 w-4" /> Accept &amp; Email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Category upload panel (drag & drop) ---------- */
const ADMIN_CATEGORIES = [
  { name: 'Handbags',   slug: 'handbags' },
  { name: 'Potli Bags', slug: 'potli-bags' },
  { name: 'Flowers',    slug: 'flowers' },
  { name: 'Home Decor', slug: 'home-decor' },
  { name: 'Uncategorised', slug: 'uncategorised' },
]

function UploadPanel({ onUploaded }) {
  const [category, setCategory] = useState('handbags')
  const [drag, setDrag] = useState(false)
  const [queue, setQueue] = useState([]) // { name, status, progress, url?, error? }

  const upload = async (files) => {
    const list = Array.from(files)
    setQueue(q => [
      ...list.map(f => ({ name: f.name, status: 'queued', progress: 0 })),
      ...q,
    ])
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      setQueue(q => q.map(x => x.name === f.name && x.status === 'queued' ? { ...x, status: 'uploading' } : x))
      const fd = new FormData()
      fd.append('file', f)
      fd.append('category', category)
      try {
        const r = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd })
        const j = await r.json().catch(() => ({}))
        if (r.ok) {
          setQueue(q => q.map(x => x.name === f.name && x.status === 'uploading' ? { ...x, status: 'done', url: j.url } : x))
        } else {
          setQueue(q => q.map(x => x.name === f.name && x.status === 'uploading' ? { ...x, status: 'failed', error: j.error || `HTTP ${r.status}` } : x))
        }
      } catch (e) {
        setQueue(q => q.map(x => x.name === f.name && x.status === 'uploading' ? { ...x, status: 'failed', error: e.message } : x))
      }
    }
    toast.success('Upload finished.')
    onUploaded?.()
  }

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false)
    if (e.dataTransfer?.files?.length) upload(e.dataTransfer.files)
  }
  const onFilePicked = (e) => {
    if (e.target.files?.length) upload(e.target.files)
    e.target.value = ''
  }

  return (
    <Card className="bg-ivory border-beige">
      <CardHeader>
        <CardTitle className="font-serif text-xl text-charcoal">Upload product images</CardTitle>
        <div className="text-sm text-charcoal/60">
          Files are saved under <code className="text-terracotta">public/products/&lt;category&gt;/</code> and served at <code>/products/&lt;category&gt;/&lt;file&gt;</code>.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60 md:min-w-[110px]">Category</div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 bg-cream border-beige md:w-64">
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_CATEGORIES.map(c => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="ml-auto">
            <input type="file" multiple accept="image/*" onChange={onFilePicked} className="hidden" />
            <span className="inline-flex items-center gap-2 rounded-full bg-charcoal hover:bg-black text-cream px-4 h-10 cursor-pointer text-sm">
              <ImageIcon className="h-4 w-4" /> Choose files
            </span>
          </label>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-colors ${drag ? 'border-terracotta bg-terracotta/5' : 'border-beige bg-cream/60'}`}
        >
          <ImageIcon className={`h-10 w-10 mx-auto ${drag ? 'text-terracotta' : 'text-charcoal/40'}`} />
          <div className="mt-3 font-serif text-lg text-charcoal">Drag & drop images here</div>
          <div className="text-sm text-charcoal/60 mt-1">JPG, PNG, WebP, AVIF or GIF · up to 8 MB each · multi-file supported</div>
        </div>

        {queue.length > 0 && (
          <div className="rounded-xl bg-cream border border-beige p-3 space-y-2 max-h-72 overflow-y-auto">
            {queue.map((q, i) => (
              <div key={`${q.name}-${i}`} className="flex items-center gap-3 text-sm">
                <div className="flex-1 truncate text-charcoal">{q.name}</div>
                {q.status === 'queued' && <span className="text-[11px] text-charcoal/50">queued</span>}
                {q.status === 'uploading' && <span className="text-[11px] text-terracotta">uploading…</span>}
                {q.status === 'done' && (
                  <>
                    <span className="text-[11px] text-sage-dark">done</span>
                    <button onClick={() => { navigator.clipboard.writeText(q.url); toast.success('URL copied') }}
                            className="text-[11px] text-terracotta hover:underline">copy URL</button>
                    <a href={q.url} target="_blank" rel="noreferrer" className="text-[11px] text-charcoal/70 hover:underline">open</a>
                  </>
                )}
                {q.status === 'failed' && <span className="text-[11px] text-red-600">failed: {q.error}</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
function Dashboard() {
  const [tab, setTab] = useState('overview')
  const [busy, setBusy] = useState(false)

  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [uploads, setUploads] = useState([])
  const [contacts, setContacts] = useState([])
  const [subs, setSubs] = useState([])
  const [payments, setPayments] = useState([])

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [uploadCat, setUploadCat] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const loadAll = async () => {
    setBusy(true)
    try {
      const j = async (u) => (await fetch(u, { credentials: 'include' })).json()
      const [s, o, u, c, n, p] = await Promise.all([
        j('/api/admin/stats'),
        j(`/api/admin/custom-orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
        j('/api/admin/uploads'),
        j('/api/admin/contacts'),
        j('/api/admin/newsletter'),
        j('/api/admin/payments'),
      ])
      setStats(s); setOrders(o.orders || []); setUploads(u.uploads || [])
      setContacts(c.contacts || []); setSubs(n.subscribers || []); setPayments(p.payments || [])
    } catch (e) { toast.error('Failed to load data') }
    finally { setBusy(false) }
  }
  useEffect(() => { loadAll() /* eslint-disable-next-line */ }, [statusFilter])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(o =>
      [o.name, o.contact, o.email, o.product_type, o.occasion, o.notes].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    )
  }, [orders, search])

  const filteredUploads = useMemo(() => {
    if (uploadCat === 'all') return uploads
    return uploads.filter(u => (u.category || 'uncategorised') === uploadCat)
  }, [uploads, uploadCat])

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    location.reload()
  }

  const copy = async (t) => {
    try { await navigator.clipboard.writeText(t); toast.success('Copied') } catch { toast.error('Copy failed') }
  }
  const deleteUpload = async (id) => {
    if (!confirm('Delete this upload? The file will be removed from disk.')) return
    const r = await fetch(`/api/admin/uploads/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) { toast.success('Deleted'); loadAll() } else toast.error('Delete failed')
  }

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-beige">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-10"><img src="/brand/sutrakriti-logo.png" alt="SutraKriti" className="h-full w-auto" /></div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] tracking-[0.3em] uppercase text-terracotta">The Atelier</span>
              <span className="font-serif text-lg text-charcoal">Studio Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadAll} disabled={busy} variant="ghost" className="text-charcoal">
              <RefreshCw className={`h-4 w-4 mr-2 ${busy ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={logout} variant="outline" className="rounded-full border-charcoal/20">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-ivory border border-beige rounded-full p-1 h-11 mb-6 flex-wrap">
            <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              <ClipboardList className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              Custom Orders {stats?.orders?.pending ? <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-sage/25 text-[11px]">{stats.orders.pending}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="uploads" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              <ImageIcon className="h-4 w-4 mr-2" /> Uploads
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              <MessageSquare className="h-4 w-4 mr-2" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="subs" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              <Users className="h-4 w-4 mr-2" /> Newsletter
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              <CreditCard className="h-4 w-4 mr-2" /> Payments
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Orders" value={stats?.orders?.total ?? '—'} sub={`${stats?.orders?.pending ?? 0} pending`} />
              <StatCard label="Accepted" value={stats?.orders?.accepted ?? '—'} sub={`${stats?.orders?.completed ?? 0} completed`} />
              <StatCard label="Uploads" value={stats?.uploads ?? '—'} sub="Product images" />
              <StatCard label="Subscribers" value={stats?.newsletter ?? '—'} sub={`${stats?.contacts ?? 0} messages`} />
            </div>

            <Card className="bg-ivory border-beige">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl text-charcoal">Recent enquiries</CardTitle>
                <Button variant="link" onClick={() => setTab('orders')} className="text-terracotta">View all →</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-beige">
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">When</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Name</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Product</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Occasion</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stats?.recent || []).map(r => (
                      <TableRow key={r.id} className="border-beige">
                        <TableCell className="text-charcoal/70 text-sm whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                        <TableCell className="font-medium text-charcoal">{r.name}</TableCell>
                        <TableCell className="text-charcoal/80">{r.product_type || '—'}</TableCell>
                        <TableCell className="text-charcoal/80">{r.occasion || '—'}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.recent || stats.recent.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center text-charcoal/50 py-8">No enquiries yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <Card className="bg-ivory border-beige">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="font-serif text-xl text-charcoal">Custom orders</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
                    <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, product…" className="pl-9 h-9 bg-cream border-beige w-64" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 bg-cream border-beige w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-beige">
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Received</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Name</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Contact</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Product</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Occasion</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Status</TableHead>
                      <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(o => (
                      <TableRow key={o.id} className="border-beige hover:bg-cream/50">
                        <TableCell className="text-charcoal/70 whitespace-nowrap">{fmtDate(o.created_at)}</TableCell>
                        <TableCell className="font-medium text-charcoal">{o.name}
                          {o.email && <div className="text-xs text-charcoal/50">{o.email}</div>}
                        </TableCell>
                        <TableCell className="text-charcoal/80 whitespace-nowrap">{o.contact}</TableCell>
                        <TableCell className="text-charcoal/80">{o.product_type || '—'}</TableCell>
                        <TableCell className="text-charcoal/80">{o.occasion || '—'}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(o)}>Open →</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-charcoal/50 py-10">No orders match your filters.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Uploads */}
          <TabsContent value="uploads" className="space-y-6">
            <UploadPanel onUploaded={loadAll} />
            <Card className="bg-ivory border-beige">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-xl text-charcoal">Product image library</CardTitle>
                  <div className="text-sm text-charcoal/60">Files stored under <code className="text-terracotta">public/products/&lt;category&gt;/</code>.</div>
                </div>
                <Select value={uploadCat} onValueChange={setUploadCat}>
                  <SelectTrigger className="h-9 bg-cream border-beige w-52"><SelectValue placeholder="Filter category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {ADMIN_CATEGORIES.map(c => (
                      <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {filteredUploads.length === 0 ? (
                  <div className="py-14 text-center text-charcoal/50">
                    No uploads in this category yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredUploads.map(u => (
                      <div key={u.id} className="group relative rounded-xl overflow-hidden border border-beige bg-cream">
                        <div className="aspect-square bg-beige/40">
                          <img src={u.url} alt={u.filename} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-charcoal truncate flex-1" title={u.filename}>{u.filename}</div>
                            {u.category && <Badge className="bg-beige text-charcoal border-0 rounded-full text-[9px] tracking-widest uppercase">{u.category}</Badge>}
                          </div>
                          <div className="text-[11px] text-charcoal/50 flex items-center justify-between">
                            <span>{fmtSize(u.size_bytes)}</span>
                            <span>{fmtDate(u.created_at)}</span>
                          </div>
                        </div>
                        <div className="absolute inset-x-2 top-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copy(u.url)} className="h-8 w-8 rounded-full bg-white/95 shadow text-charcoal flex items-center justify-center hover:bg-white" title="Copy URL">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteUpload(u.id)} className="h-8 w-8 rounded-full bg-white/95 shadow text-red-600 flex items-center justify-center hover:bg-white" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts">
            <SimpleTable
              title="Contact messages" rows={contacts}
              columns={[
                { key: 'created_at', label: 'When', render: v => fmt(v), width: '180px' },
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email', render: v => v || '—' },
                { key: 'message', label: 'Message', render: v => <span className="whitespace-pre-wrap">{v}</span> },
              ]}
              empty="No contact messages yet."
            />
          </TabsContent>

          {/* Newsletter */}
          <TabsContent value="subs">
            <SimpleTable
              title="Newsletter subscribers" rows={subs}
              columns={[
                { key: 'subscribed_at', label: 'Subscribed', render: v => fmt(v), width: '200px' },
                { key: 'email', label: 'Email' },
              ]}
              empty="No subscribers yet."
            />
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <SimpleTable
              title="Payments" rows={payments}
              columns={[
                { key: 'created_at', label: 'When', render: v => fmt(v), width: '180px' },
                { key: 'product_name', label: 'Product' },
                { key: 'amount', label: 'Amount', render: v => v ? `₹${(v/100).toLocaleString('en-IN')}` : '—' },
                { key: 'razorpay_order_id', label: 'Razorpay Order' },
                { key: 'status', label: 'Status', render: v => <Badge className="rounded-full uppercase text-[10px] tracking-widest">{v}</Badge> },
              ]}
              empty="No payments yet. (Enable Razorpay to start collecting.)"
            />
          </TabsContent>
        </Tabs>
      </main>

      <OrderDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={() => loadAll()} />
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <Card className="bg-ivory border-beige">
      <CardContent className="p-5">
        <div className="text-[10px] tracking-[0.3em] uppercase text-charcoal/60">{label}</div>
        <div className="mt-1 font-serif text-4xl text-charcoal">{value}</div>
        <div className="text-xs text-charcoal/50 mt-1">{sub}</div>
      </CardContent>
    </Card>
  )
}

function SimpleTable({ title, rows, columns, empty }) {
  return (
    <Card className="bg-ivory border-beige">
      <CardHeader><CardTitle className="font-serif text-xl text-charcoal">{title}</CardTitle></CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-beige">
              {columns.map(c => (
                <TableHead key={c.key} style={c.width ? { width: c.width } : undefined} className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={columns.length} className="text-center text-charcoal/50 py-10">{empty}</TableCell></TableRow>}
            {rows.map((r, i) => (
              <TableRow key={r.id || r.email || i} className="border-beige">
                {columns.map(c => (
                  <TableCell key={c.key} className="text-charcoal/85">{c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ---------- Root: auth gate ---------- */
function AdminApp() {
  const [status, setStatus] = useState('loading') // loading | in | out
  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then(r => setStatus(r.ok ? 'in' : 'out'))
      .catch(() => setStatus('out'))
  }, [])
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal/50 tracking-widest text-xs uppercase">Loading…</div>
      </div>
    )
  }
  if (status === 'out') return <LoginCard onAuth={() => setStatus('in')} />
  return <Dashboard />
}

export default AdminApp
