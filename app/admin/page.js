'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import {
  LogOut, RefreshCw, Search, CheckCircle2, Clock, Send, Mail, Trash2, Copy,
  Image as ImageIcon, Users, MessageSquare, CreditCard, ClipboardList, Undo2,
  ExternalLink, StickyNote, ShieldCheck, Sparkles, Package, Plus, Minus,
  Pencil, Boxes, AlertTriangle, PackageX, PackagePlus, ArrowUp, ArrowDown,
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
import { CATEGORIES, UNCATEGORISED } from '@/lib/categories'
import { DEFAULT_GALLERY } from '@/lib/gallery'
import SiteImage from '@/components/site-image'

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
          <div className="h-14 mx-auto"><SiteImage src="/brand/sutrakriti-logo.png" alt="SutraKriti" width={180} height={72} className="h-full w-auto mx-auto" /></div>
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
const UPLOAD_CATEGORIES = [...CATEGORIES, { name: 'Uncategorised', slug: UNCATEGORISED }]

function UploadPanel({ onUploaded }) {
  const [category, setCategory] = useState(CATEGORIES[0]?.slug || UNCATEGORISED)
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
          Files are saved under <code className="text-terracotta">public/products/&lt;category&gt;/</code> and served from <code>/api/media/&lt;category&gt;/&lt;file&gt;</code>.
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
              {UPLOAD_CATEGORIES.map(c => (
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
          <div className="text-sm text-charcoal/60 mt-1">JPG, PNG, WebP, AVIF or GIF · up to 8 MB each · resized to WebP on upload · multi-file supported</div>
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

function GallerySettings({ uploads, initialImages, onSaved }) {
  const [selected, setSelected] = useState(initialImages)
  const [saving, setSaving] = useState(false)

  useEffect(() => setSelected(initialImages), [initialImages])

  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/gallery', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: selected }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(data.error || 'Failed to save gallery')
        return
      }
      onSaved(data.images)
      toast.success('Storefront gallery updated')
    } catch (error) {
      toast.error(error.message || 'Failed to save gallery')
    } finally {
      setSaving(false)
    }
  }

  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= selected.length) return
    setSelected(current => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const selectedSet = new Set(selected)
  const availableImages = [
    ...DEFAULT_GALLERY.map((image, index) => ({
      id: `default-${index}`,
      filename: `Default gallery image ${index + 1}`,
      url: image.src,
    })),
    ...uploads,
  ].filter((image, index, list) =>
    !selectedSet.has(image.url) && list.findIndex(candidate => candidate.url === image.url) === index
  )
  const addImage = url => {
    if (selected.length >= 30) {
      toast.error('The storefront gallery can contain up to 30 images')
      return
    }
    setSelected(current => current.includes(url) ? current : [...current, url])
  }

  return (
    <div className="space-y-6">
      <Card className="bg-ivory border-beige">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-xl text-charcoal">Selected storefront images</CardTitle>
            <div className="text-sm text-charcoal/60 mt-1">Select and order between 1 and 30 images. The first image appears first in the gallery.</div>
          </div>
          <Button onClick={save} disabled={saving || selected.length === 0} className="rounded-full bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white" data-testid="save-gallery-btn">
            {saving ? 'Saving…' : 'Save gallery'}
          </Button>
        </CardHeader>
        <CardContent>
          {selected.length === 0 ? (
            <div className="py-10 text-center text-sm text-charcoal/50">Choose images from the library below.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {selected.map((url, index) => (
                <div key={url} className="overflow-hidden rounded-xl border border-beige bg-cream" data-testid={`gallery-selected-${index}`}>
                  <div className="relative aspect-square">
                    <SiteImage src={url} alt={`Gallery image ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-charcoal/80 text-white text-xs px-2 py-1">{index + 1}</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} earlier`} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-beige disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1} aria-label={`Move image ${index + 1} later`} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-beige disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setSelected(current => current.filter(image => image !== url))} disabled={selected.length === 1} aria-label={`Remove image ${index + 1}`} className="text-xs text-red-600 hover:underline px-2 disabled:opacity-30 disabled:no-underline">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-ivory border-beige">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-charcoal">Image library</CardTitle>
          <div className="text-sm text-charcoal/60">Add a current default image or an uploaded image. Upload new images from the Uploads tab.</div>
        </CardHeader>
        <CardContent>
          {availableImages.length === 0 ? (
            <div className="py-10 text-center text-sm text-charcoal/50">All available images are already selected.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {availableImages.map(upload => (
                <button key={upload.id} type="button" onClick={() => addImage(upload.url)} className="group overflow-hidden rounded-xl border border-beige bg-cream text-left hover:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta" aria-label={`Add ${upload.filename} to storefront gallery`}>
                  <div className="relative aspect-square bg-beige/40">
                    <SiteImage src={upload.url} alt={upload.filename} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute inset-0 flex items-center justify-center bg-charcoal/0 group-hover:bg-charcoal/25 transition-colors">
                      <Plus className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                    </span>
                  </div>
                  <div className="p-2 text-xs text-charcoal truncate" title={upload.filename}>{upload.filename}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
  const [products, setProducts] = useState([])
  const [galleryImages, setGalleryImages] = useState(DEFAULT_GALLERY.map(image => image.src))

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [uploadCat, setUploadCat] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [productDialog, setProductDialog] = useState(null) // { mode:'create'|'edit', product }
  const [stockDialog, setStockDialog] = useState(null)     // product object

  const loadAll = async () => {
    setBusy(true)
    try {
      const j = async (u) => (await fetch(u, { credentials: 'include' })).json()
      const [s, o, u, c, n, p, pr, gallery] = await Promise.all([
        j('/api/admin/stats'),
        j(`/api/admin/custom-orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
        j('/api/admin/uploads'),
        j('/api/admin/contacts'),
        j('/api/admin/newsletter'),
        j('/api/admin/payments'),
        j('/api/admin/products'),
        j('/api/admin/gallery'),
      ])
      setStats(s); setOrders(o.orders || []); setUploads(u.uploads || [])
      setContacts(c.contacts || []); setSubs(n.subscribers || []); setPayments(p.payments || [])
      setProducts(pr.products || [])
      if (Array.isArray(gallery.images)) setGalleryImages(gallery.images)
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
            <div className="h-10"><SiteImage src="/brand/sutrakriti-logo.png" alt="SutraKriti" width={150} height={60} className="h-full w-auto" /></div>
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
            <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4" data-testid="tab-products">
              <Package className="h-4 w-4 mr-2" /> Products {stats?.products?.lowStock ? <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-terracotta/20 text-[11px]" data-testid="low-stock-badge">{stats.products.lowStock}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              Custom Orders {stats?.orders?.pending ? <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-sage/25 text-[11px]">{stats.orders.pending}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="uploads" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4">
              <ImageIcon className="h-4 w-4 mr-2" /> Uploads
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-full data-[state=active]:bg-terracotta data-[state=active]:text-white px-4" data-testid="tab-gallery">
              <ImageIcon className="h-4 w-4 mr-2" /> Gallery
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
              <StatCard label="Products" value={stats?.products?.total ?? '—'} sub={`${stats?.products?.active ?? 0} active · ${stats?.products?.totalStock ?? 0} in stock`} testId="stat-products" />
              <StatCard label="Low / Out of stock" value={`${stats?.products?.lowStock ?? 0} / ${stats?.products?.outOfStock ?? 0}`} sub="Needs attention" testId="stat-low-stock" />
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

          {/* Products (persisted in MySQL) */}
          <TabsContent value="products" className="space-y-6">
            <ProductsPanel
              products={products}
              onCreate={() => setProductDialog({ mode: 'create', product: null })}
              onEdit={(p) => setProductDialog({ mode: 'edit', product: p })}
              onStock={(p) => setStockDialog(p)}
              onDelete={async (p) => {
                if (!confirm(`Delete "${p.name}" permanently? This cannot be undone.`)) return
                const r = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE', credentials: 'include' })
                if (r.ok) { toast.success('Product deleted'); loadAll() } else toast.error('Delete failed')
              }}
            />
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
                    {UPLOAD_CATEGORIES.map(c => (
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
                        <div className="relative aspect-square bg-beige/40">
                          <SiteImage src={u.url} alt={u.filename} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
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

          <TabsContent value="gallery" className="space-y-6">
            <GallerySettings
              uploads={uploads}
              initialImages={galleryImages}
              onSaved={setGalleryImages}
            />
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
      <ProductDialog
        state={productDialog}
        onClose={() => setProductDialog(null)}
        onSaved={() => { setProductDialog(null); loadAll() }}
      />
      <StockDialog
        product={stockDialog}
        onClose={() => setStockDialog(null)}
        onSaved={() => { setStockDialog(null); loadAll() }}
      />
    </div>
  )
}

function StatCard({ label, value, sub, testId }) {
  return (
    <Card className="bg-ivory border-beige" data-testid={testId}>
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

/* ---------- Products panel: CRUD + inventory ---------- */
function StockBadge({ product }) {
  const q = product.stockQuantity ?? 0
  const t = product.lowStockThreshold ?? 3
  if (q === 0) return <Badge className="bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] tracking-widest uppercase" data-testid={`stock-badge-${product.id}`}>Out of stock</Badge>
  if (q <= t) return <Badge className="bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] tracking-widest uppercase" data-testid={`stock-badge-${product.id}`}>Low · {q}</Badge>
  return <Badge className="bg-sage/25 text-charcoal border border-sage/40 rounded-full text-[10px] tracking-widest uppercase" data-testid={`stock-badge-${product.id}`}>In stock · {q}</Badge>
}

function ProductsPanel({ products, onCreate, onEdit, onStock, onDelete }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // all | in | low | out

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false
      const q0 = q.trim().toLowerCase()
      if (q0 && ![p.name, p.category, p.id, p.description].filter(Boolean).some(v => String(v).toLowerCase().includes(q0))) return false
      const qty = p.stockQuantity ?? 0
      const t = p.lowStockThreshold ?? 3
      if (stockFilter === 'out' && qty !== 0) return false
      if (stockFilter === 'low' && !(qty > 0 && qty <= t)) return false
      if (stockFilter === 'in'  && qty <= t) return false
      return true
    })
  }, [products, q, cat, stockFilter])

  return (
    <Card className="bg-ivory border-beige" data-testid="products-card">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <CardTitle className="font-serif text-xl text-charcoal">Product catalogue</CardTitle>
          <div className="text-sm text-charcoal/60">Persisted in MySQL · {products.length} product{products.length === 1 ? '' : 's'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, id…" className="pl-9 h-9 bg-cream border-beige w-56" data-testid="product-search-input" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-9 bg-cream border-beige w-44" data-testid="product-category-filter"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All categories' : c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="h-9 bg-cream border-beige w-36" data-testid="product-stock-filter"><SelectValue placeholder="Stock" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="out">Out</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onCreate} className="rounded-full bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white" data-testid="add-product-btn">
            <Plus className="h-4 w-4 mr-2" /> New product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-beige">
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Image</TableHead>
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Name</TableHead>
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Category</TableHead>
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Price</TableHead>
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Stock</TableHead>
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60">Status</TableHead>
              <TableHead className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="border-beige hover:bg-cream/50" data-testid={`product-row-${p.id}`}>
                <TableCell>
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-beige/40 border border-beige">
                    {p.image ? <SiteImage src={p.image} alt={p.name} fill sizes="56px" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-charcoal/30"><ImageIcon className="h-5 w-5" /></div>}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-charcoal">{p.name}
                  <div className="text-[11px] text-charcoal/50">{p.id}</div>
                </TableCell>
                <TableCell className="text-charcoal/80">{p.category || '—'}</TableCell>
                <TableCell className="text-charcoal/80 whitespace-nowrap">₹{Number(p.price).toLocaleString('en-IN')}</TableCell>
                <TableCell><StockBadge product={p} /></TableCell>
                <TableCell>
                  {p.isActive
                    ? <Badge className="bg-sage/25 text-charcoal border border-sage/40 rounded-full text-[10px] tracking-widest uppercase">Active</Badge>
                    : <Badge className="bg-charcoal/10 text-charcoal border border-charcoal/20 rounded-full text-[10px] tracking-widest uppercase">Hidden</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => onStock(p)} data-testid={`stock-btn-${p.id}`}>
                    <Boxes className="h-4 w-4 mr-1" /> Stock
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(p)} data-testid={`edit-product-btn-${p.id}`}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(p)} className="text-red-600 hover:text-red-700" data-testid={`delete-product-btn-${p.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-charcoal/50 py-10">No products match your filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ProductDialog({ state, onClose, onSaved }) {
  const isEdit = state?.mode === 'edit'
  const [form, setForm] = useState(() => ({
    id: '', name: '', category: '', price: 0,
    description: '', material: '', dimensions: '', care: '', delivery: '',
    colors: '', images: '',
    is_new: false, is_bestseller: false, per_piece: false, per_pair: false, per_bouquet: false, is_active: true,
    stock_quantity: 0, low_stock_threshold: 3, sort_order: 999,
  }))
  const [busy, setBusy] = useState(false)
  const productCategories = [
    ...CATEGORIES,
    ...(form.category && !CATEGORIES.some(category => category.name === form.category)
      ? [{ name: form.category }]
      : []),
  ]

  useEffect(() => {
    if (!state) return
    if (state.mode === 'edit' && state.product) {
      const p = state.product
      setForm({
        id: p.id || '', name: p.name || '', category: p.category || '',
        price: Number(p.price) || 0,
        description: p.description || '', material: p.material || '',
        dimensions: p.dimensions || '', care: p.care || '', delivery: p.delivery || '',
        colors: (p.colors || []).join(', '),
        images: (p.images || []).join('\n'),
        is_new: !!p.new, is_bestseller: !!p.bestseller,
        per_piece: !!p.perPiece, per_pair: !!p.perPair, per_bouquet: !!p.perBouquet,
        is_active: !!p.isActive,
        stock_quantity: Number(p.stockQuantity) || 0,
        low_stock_threshold: Number(p.lowStockThreshold) || 3,
        sort_order: Number(p.sortOrder) || 999,
      })
    } else {
      setForm({
        id: '', name: '', category: 'Handbags', price: 0,
        description: '', material: '', dimensions: '', care: '', delivery: '',
        colors: '', images: '',
        is_new: false, is_bestseller: false, per_piece: false, per_pair: false, per_bouquet: false, is_active: true,
        stock_quantity: 0, low_stock_threshold: 3, sort_order: 999,
      })
    }
  }, [state])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setBusy(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
        sort_order: Number(form.sort_order) || 0,
        colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
        images: form.images.split(/\n|,/).map(s => s.trim()).filter(Boolean),
      }
      if (isEdit) delete payload.id
      const url = isEdit ? `/api/admin/products/${state.product.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(j.error || 'Save failed'); return }
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSaved?.()
    } finally { setBusy(false) }
  }

  if (!state) return null

  return (
    <Dialog open={!!state} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-cream border-beige max-h-[90vh] overflow-y-auto" data-testid="product-dialog">
        <DialogHeader>
          <div className="text-[10px] tracking-[0.3em] uppercase text-terracotta">{isEdit ? 'Edit product' : 'New product'}</div>
          <DialogTitle className="font-serif text-2xl text-charcoal">
            {isEdit ? state.product.name : 'Add a new product'}
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Stored in the <code className="text-terracotta">products</code> MySQL table. Inventory is managed separately from the Stock button.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Product ID (optional)</div>
                <Input value={form.id} onChange={e=>setForm(f=>({...f, id:e.target.value}))} placeholder="auto-generated from name" className="bg-ivory border-beige" data-testid="product-id-input" />
              </div>
            )}
            <div className={isEdit ? 'md:col-span-2' : ''}>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Name *</div>
              <Input required value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} className="bg-ivory border-beige" data-testid="product-name-input" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Category</div>
              <Select
                value={form.category || '__none__'}
                onValueChange={value => setForm(f => ({ ...f, category: value === '__none__' ? '' : value }))}
              >
                <SelectTrigger className="bg-ivory border-beige" data-testid="product-category-input">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Uncategorised</SelectItem>
                  {productCategories.map(category => (
                    <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Price (₹)</div>
              <Input type="number" min="0" value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} className="bg-ivory border-beige" data-testid="product-price-input" />
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Description</div>
            <Textarea value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} className="bg-ivory border-beige min-h-[80px]" data-testid="product-description-input" />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Material</div>
              <Input value={form.material} onChange={e=>setForm(f=>({...f, material:e.target.value}))} className="bg-ivory border-beige" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Dimensions</div>
              <Input value={form.dimensions} onChange={e=>setForm(f=>({...f, dimensions:e.target.value}))} className="bg-ivory border-beige" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Care</div>
              <Input value={form.care} onChange={e=>setForm(f=>({...f, care:e.target.value}))} className="bg-ivory border-beige" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Delivery</div>
              <Input value={form.delivery} onChange={e=>setForm(f=>({...f, delivery:e.target.value}))} className="bg-ivory border-beige" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Colours (comma-separated)</div>
              <Input value={form.colors} onChange={e=>setForm(f=>({...f, colors:e.target.value}))} placeholder="Ivory, Beige" className="bg-ivory border-beige" data-testid="product-colors-input" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Sort order</div>
              <Input type="number" value={form.sort_order} onChange={e=>setForm(f=>({...f, sort_order:e.target.value}))} className="bg-ivory border-beige" />
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Images (one URL per line or comma-separated)</div>
            <Textarea value={form.images} onChange={e=>setForm(f=>({...f, images:e.target.value}))} placeholder="/products/handbags/xxx.jpg" className="bg-ivory border-beige font-mono text-sm min-h-[70px]" data-testid="product-images-input" />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">{isEdit ? 'Current stock (read-only here)' : 'Initial stock qty'}</div>
              <Input type="number" min="0" disabled={isEdit} value={form.stock_quantity} onChange={e=>setForm(f=>({...f, stock_quantity:e.target.value}))} className="bg-ivory border-beige disabled:opacity-60" data-testid="product-stock-input" />
              {isEdit && <div className="text-[11px] text-charcoal/50 mt-1">Use the Stock button to adjust inventory.</div>}
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">Low-stock threshold</div>
              <Input type="number" min="0" value={form.low_stock_threshold} onChange={e=>setForm(f=>({...f, low_stock_threshold:e.target.value}))} className="bg-ivory border-beige" />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
                <input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f, is_active:e.target.checked}))} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" data-testid="product-active-checkbox" />
                Active (visible on storefront)
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
                <input type="checkbox" checked={form.is_new} onChange={e=>setForm(f=>({...f, is_new:e.target.checked}))} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" />
                Mark as “New”
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
                <input type="checkbox" checked={form.is_bestseller} onChange={e=>setForm(f=>({...f, is_bestseller:e.target.checked}))} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" />
                Bestseller
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
                <input type="checkbox" checked={form.per_piece} onChange={e=>setForm(f=>({...f, per_piece:e.target.checked, per_pair:false, per_bouquet:false}))} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" data-testid="product-per-piece-checkbox" />
                per Piece
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
                <input type="checkbox" checked={form.per_pair} onChange={e=>setForm(f=>({...f, per_pair:e.target.checked, per_piece:false, per_bouquet:false}))} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" data-testid="product-per-pair-checkbox" />
                per Pair
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
                <input type="checkbox" checked={form.per_bouquet} onChange={e=>setForm(f=>({...f, per_bouquet:e.target.checked, per_piece:false, per_pair:false}))} className="h-4 w-4 accent-[color:var(--sk-terracotta)]" data-testid="product-per-bouquet-checkbox" />
                per Bouquet
              </label>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={busy} type="submit" className="rounded-full bg-terracotta hover:bg-[color:var(--sk-terracotta-dark)] text-white" data-testid="product-save-btn">
              {busy ? 'Saving…' : (isEdit ? 'Save changes' : 'Create product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StockDialog({ product, onClose, onSaved }) {
  const [mode, setMode] = useState('delta') // 'delta' | 'set'
  const [delta, setDelta] = useState(1)
  const [absolute, setAbsolute] = useState(0)
  const [reason, setReason] = useState('restock')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [movements, setMovements] = useState([])

  useEffect(() => {
    if (!product) return
    setMode('delta'); setDelta(1); setAbsolute(product.stockQuantity ?? 0)
    setReason('restock'); setNote('')
    fetch(`/api/admin/products/${product.id}/stock/movements`, { credentials: 'include' })
      .then(r => r.json()).then(j => setMovements(j.movements || [])).catch(() => setMovements([]))
  }, [product])

  if (!product) return null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = mode === 'set'
        ? { mode: 'set', quantity: Number(absolute), reason, note }
        : { mode: 'delta', delta: Number(delta), reason: (Number(delta) >= 0 ? (reason || 'restock') : (reason === 'restock' ? 'sale' : reason)), note }
      const r = await fetch(`/api/admin/products/${product.id}/stock`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(j.error || 'Update failed'); return }
      toast.success(`Stock updated · ${j.previousQuantity} → ${j.stockQuantity}`)
      onSaved?.()
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-cream border-beige" data-testid="stock-dialog">
        <DialogHeader>
          <div className="text-[10px] tracking-[0.3em] uppercase text-terracotta">Inventory</div>
          <DialogTitle className="font-serif text-2xl text-charcoal">{product.name}</DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Current stock: <strong data-testid="stock-current-qty">{product.stockQuantity}</strong> · Low-stock threshold: {product.lowStockThreshold}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" variant={mode === 'delta' ? 'default' : 'outline'}
                    onClick={() => setMode('delta')}
                    className={`rounded-full ${mode === 'delta' ? 'bg-terracotta text-white hover:bg-[color:var(--sk-terracotta-dark)]' : ''}`}
                    data-testid="stock-mode-delta">
              <PackagePlus className="h-4 w-4 mr-2" /> Adjust (+/-)
            </Button>
            <Button type="button" variant={mode === 'set' ? 'default' : 'outline'}
                    onClick={() => setMode('set')}
                    className={`rounded-full ${mode === 'set' ? 'bg-terracotta text-white hover:bg-[color:var(--sk-terracotta-dark)]' : ''}`}
                    data-testid="stock-mode-set">
              <Boxes className="h-4 w-4 mr-2" /> Set exact
            </Button>
          </div>

          {mode === 'delta' ? (
            <div className="grid md:grid-cols-[auto_1fr_1fr] gap-3 items-end">
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => setDelta(d => Number(d) - 1)} data-testid="stock-decrement">
                  <Minus className="h-4 w-4" />
                </Button>
                <Input type="number" value={delta} onChange={e=>setDelta(e.target.value)} className="bg-ivory border-beige w-24 text-center" data-testid="stock-delta-input" />
                <Button type="button" variant="outline" size="icon" onClick={() => setDelta(d => Number(d) + 1)} data-testid="stock-increment">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-10 bg-ivory border-beige" data-testid="stock-reason-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="damage">Damage / loss</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
              <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" className="bg-ivory border-beige" data-testid="stock-note-input" />
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_1fr_1fr] gap-3 items-end">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-1">New quantity</div>
                <Input type="number" min="0" value={absolute} onChange={e=>setAbsolute(e.target.value)} className="bg-ivory border-beige" data-testid="stock-absolute-input" />
              </div>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-10 bg-ivory border-beige"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="damage">Damage / loss</SelectItem>
                </SelectContent>
              </Select>
              <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" className="bg-ivory border-beige" />
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={busy} type="submit" className="rounded-full bg-charcoal hover:bg-black text-cream" data-testid="stock-save-btn">
              {busy ? 'Updating…' : 'Update stock'}
            </Button>
          </DialogFooter>
        </form>

        {movements.length > 0 && (
          <div className="mt-2 rounded-lg bg-ivory border border-beige p-3 max-h-64 overflow-y-auto" data-testid="stock-history">
            <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60 mb-2">Recent movements</div>
            <ul className="space-y-1.5 text-sm">
              {movements.slice(0, 20).map(m => (
                <li key={m.id} className="flex items-center justify-between border-b border-beige/60 pb-1.5 last:border-0">
                  <span className="text-charcoal/70">{fmt(m.created_at)} · <span className="uppercase tracking-widest text-[10px] text-charcoal/50">{m.reason}</span></span>
                  <span className={`font-medium ${m.delta >= 0 ? 'text-sage-dark' : 'text-red-700'}`}>
                    {m.delta >= 0 ? '+' : ''}{m.delta} → {m.resulting_quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Root: auth gate ---------- */
function AdminApp() {
  const [status, setStatus] = useState('loading') // loading | in | out
  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)
    fetch('/api/admin/me', { credentials: 'include', signal: controller.signal })
      .then(r => setStatus(r.ok ? 'in' : 'out'))
      .catch(() => setStatus('out'))
      .finally(() => window.clearTimeout(timeout))
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
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
