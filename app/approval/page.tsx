'use client'
import { useEffect, useState } from 'react'
import { supabase, type ApprovalItem } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Check, X, RotateCcw, Loader2, Inbox, ChevronDown, ChevronUp, Image, FileText, Lightbulb, MessageSquare, TrendingUp } from 'lucide-react'

const typeIcon = (t: string) => {
  const icons: Record<string, any> = {
    product_idea: Lightbulb,
    generated_image: Image,
    listing_copy: FileText,
    customer_reply: MessageSquare,
    trend_alert: TrendingUp,
  }
  return icons[t] || FileText
}

const typeLabel = (t: string) =>
  t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const typeColor = (t: string) => {
  const colors: Record<string, string> = {
    product_idea: 'var(--gold)',
    generated_image: 'var(--blue)',
    listing_copy: 'var(--green)',
    customer_reply: '#A78BFA',
    trend_alert: '#FB923C',
  }
  return colors[t] || 'var(--cream)'
}

export default function ApprovalPage() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [done, setDone] = useState(0)
  const filters = ['all', 'product_idea', 'generated_image', 'listing_copy', 'customer_reply', 'trend_alert']
  useEffect(() => { loadItems() }, [])
  async function loadItems() {
    setLoading(true)
    const { data } = await supabase.from('approval_queue').select('*').eq('status', 'pending').order('priority', { ascending: false }).order('created_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }
  async function act(id: string, status: 'approved' | 'rejected') {
    setActing(id)
    const ts = status === 'approved' ? { approved_at: new Date().toISOString() } : { rejected_at: new Date().toISOString() }
    await supabase.from('approval_queue').update({ status, ...ts }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDone(prev => prev + 1)
    setActing(null)
    if (expanded === id) setExpanded(null)
  }
  const visible = filter === 'all' ? items : items.filter(i => i.item_type === filter)
  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 pt-12 pb-5">
        <p className="text-xs tracking-widest uppercase text-gold-500 mb-1 font-medium">Review Center</p>
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-2xl text-cream">Approval Queue</h1>
          {done > 0 && <span className="badge badge-green">{done} done ✛</span>}
        </div>
        {items.length > 0 && <p className="text-xs mt-1" style={{ color: 'rgba(240,235,224,0.4)' }}>{items.length} waiting</p>}
      </div>
      <div className="flex gap-2 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ background: filter === f ? 'rgba(201,151,58,0.2)' : 'var(--surface-2)', color: filter === f ? 'var(--gold-light)' : 'rgba(240,235,224,0.4)', border: `1px solid ${filter === f ? 'rgba(201,151,58,0.4)' : 'var(--surface-3)'}` }}>
            {f === 'all' ? 'All' : typeLabel(f)}
          </button>
        ))}
      </div>
      <div className="px-4 mt-2 space-y-3 page-enter">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 w-full" />)
        : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)' }}>
              <Inbox size={28} style={{ color: 'rgba(201,151,58,0.4)' }} />
            </div>
            <p className="font-serif text-lg text-cream mb-1">All caught up ✝</p>
            <p className="text-xs" style={{ color: 'rgba(240,235,224,0.35)' }}>No items waiting for approval</p>
          </div>
        ) : visible.map(item => {
          const Icon = typeIcon(item.item_type); const color = typeColor(item.item_type)
          const isExpanded = expanded === item.id; const isActing = acting === item.id
          return (
            <div key={item.id} className="card transition-all duration-200" style={{ opacity: isActing ? 0.5 : 1 }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}18` }}><Icon size={18} style={{ color }} /></div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: `${color}99` }}>{typeLabel(item.item_type)}</span>
                  <p className="text-sm font-medium text-cream leading-snug mt-0.5">{item.title}</p>
                  {item.summary && <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'rgba(240,235,224,0.5)' }}>{item.summary}</p>}
                </div>
                <button onClick={() => setExpanded(isExpanded ? null : item.id)} className="p-1.5 rounded-lg transition-colors flex-shrink-0" style={{ color: 'rgba(240,235,224,0.3)' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {isExpanded && <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--surface-3)' }}>
                {item.firefly_prompt && <div className="card-sm"><p className="stat-label mb-1.5">Firefly Prompt</p><p className="text-xs leading-relaxed" style={{ color: 'rgba(240,235,224,0.6)' }}>{item.firefly_prompt}</p></div>}
                {item.proposed_title && <div className="card-sm"><p className="stat-label mb-1.5">Proposed Title</p><p className="text-sm text-cream">{item.proposed_title}</p></div>}
                {item.proposed_price && <div className="flex items-center gap-2"><span className="stat-label">Price:</span><span className="font-mono text-sm" style={{ color: 'var(--green)' }}>${item.proposed_price.toFixed(2)}</span></div>}
              </div>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => act(item.id, 'rejected')} disabled={!!acting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95" style={{ background: 'rgba(224,82,82,0.12)', color: 'var(--red)', border: '1px solid rgba(224,82,82,0.2)' }}>
                  {isActing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Reject
                </button>
                <button onClick={() => act(item.id, 'approved')} disabled={!!acting} className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95" style={{ background: 'rgba(76,175,125,0.18)', color: 'var(--green)', border: '1px solid rgba(76,175,125,0.3)' }}>
                  {isActing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve
                </button>
              </div>
            </div>
          )
        })}
        {!loading && visible.length > 0 && <button onClick={loadItems} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs transition-all" style={{ color: 'rgba(240,235,224,0.3)' }}><RotateCcw size={12} /> Refresh</button>}
      </div>
      <Navigation />
    </div>
  )
}
