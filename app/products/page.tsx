'use client'
import { useEffect, useState } from 'react'
import { supabase, type Product, type ProductStatus } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Search, Package, TrendingUp, DollarSign, Filter } from 'lucide-react'

const statusColors: Record<ProductStatus, string> = {
  live: 'var(--green)',
  idea: 'rgba(240,235,224,0.3)',
  pending_image: 'var(--gold)',
  pending_approval: 'var(--gold)',
  approved: 'var(--blue)',
  ready_to_publish: '#A78BFA',
  paused: 'var(--red)',
  archived: 'rgba(240,235,224,0.2)',
}

const platformLabel: Record<string, string> = {
  etsy_digital: 'Etsy Digital', etsy_pod: 'Etsy POD', amazon_merch: 'Amazon', kdp: 'KDP', pinterest: 'Pinterest',
}

const typeLabel: Record<string, string> = {
  digital_download: 'Digital', pod_physical: 'POD', kdp_book: 'Book', notion_template: 'Notion', canva_template: 'Canva', svg_cut_file: 'SVG', spreadsheet_template: 'Sheet',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'revenue' | 'margin' | 'recent'>('revenue')
  const statuses = ['all', 'live', 'pending_approval', 'idea', 'paused']
  useEffect(() => { loadProducts() }, [])
  useEffect(() => {
    let result = [...products]
    if (search) result = result.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter)
    result.sort((a, b) => {
      if (sortBy === 'revenue') return (b.total_revenue || 0) - (a.total_revenue || 0)
      if (sortBy === 'margin') return (b.margin_pct || 0) - (a.margin_pct || 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setFiltered(result)
  }, [products, search, statusFilter, sortBy])
  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').neq('status', 'archived').order('total_revenue', { ascending: false })
    setProducts(data || []); setFiltered(data || []); setLoading(false)
  }
  const liveCount = products.filter(p => p.status === 'live').length
  const totalRevenue = products.reduce((s, p) => s + (p.total_revenue || 0), 0)
  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs tracking-widest uppercase text-gold-500 mb-1 font-medium">Catalog</p>
        <h1 className="font-serif text-2xl text-cream">Products</h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} /><span className="text-xs" style={{ color: 'rgba(240,235,224,0.5)' }}>{liveCount} live</span></div>
          <div className="flex items-center gap-1.5"><DollarSign size={12} style={{ color: 'var(--gold)', opacity: 0.6 }} /><span className="text-xs font-mono" style={{ color: 'rgba(240,235,224,0.5)' }}>${totalRevenue.toFixed(0)} total</span></div>
        </div>
      </div>
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,235,224,0.3)' }} />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9.spr pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ paddingLeft: '36px', background: 'var(--surface-2)', border: '1px solid var(--surface-3)', color: 'var(--cream)' }} />
        </div>
      </div>
      <div className="flex gap-2 px-4 overflow-x-auto mb-1" style={{ scrollbarWidth: 'none' }}>
        {statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all" style={{ background: statusFilter === s ? 'rgba(201,151,58,0.15)' : 'var(--surface-2)', color: statusFilter === s ? 'var(--gold-light)' : 'rgba(240,235,224,0.4)', border: `1px solid ${statusFilter === s ? 'rgba(201,151,58,0.3)' : 'var(--surface-3)'}` }}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</button>))}
      </div>
      <div className="flex items-center gap-2 px-4 mb-4 mt-3">
        <Filter size={12} style={{ color: 'rgba(240,235,224,0.3)' }} />
        {('__revenue__ margin recent'.split(' ').filter(x => x).map(s => s.trim()).filter(x => x.length).map((s, i) => {
          const labels = ['Revenue', 'Margin', 'Recent']
          const keys = ['revenue', 'margin', 'recent'] as const
          return <button key={keys[i]} onClick={() => setSortBy(keys[i])} className="text-xs px-2.5 py-1 rounded-lg transition-all" style={{ background: sortBy === keys[i] ? 'rgba(201,151,58,0.12)' : 'transparent', color: sortBy === keys[i] ? 'var(--gold)' : 'rgba(240,235,224,0.35)' }}>{labels[i]}</button>
        }))}
      </div>
      <div className="px-4 space-y-3 page-enter">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 w-full" />)
        : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16"><Package size={32} style={{ color: 'rgba(201,151,58,0.3)' }} className="mb-3" /><p className="text-sm" style={{ color: 'rgba(240,235,224,0.4)' }}>No products found</p></div>
        ) : filtered.map(product => (
          <div key={product.id} className="card">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 flex-shrink-0"><div className="w-2 h-2 rounded-full" style={{ background: statusColors[product.status] || 'rgba(240,235,224,0.2)' }} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream leading-snug mb-1.5 truncate">{product.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.product_type && <span className="badge" style={{ background: 'rgba(74,144,217,0.12)', color: 'rgba(74,144,217,0.8)', border: '1px solid rgba(74,144,217,0.2)' }}>{typeLabel[product.product_type] || product.product_type}</span>}
                  {product.platform && <span className="text-xs" style={{ color: 'rgba(240,235,224,0.35)' }}>{platformLabel[product.platform] || product.platform}</span>}
                  <span className="text-xs capitalize" style={{ color: statusColors[product.status], opacity: 0.8 }}>{product.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {product.list_price && <p className="font-mono text-sm text-cream">${product.list_price.toFixed(2)}</p>}
                {product.margin_pct && product.margin_pct > 0 && <p className="text-xs font-mono" style={{ color: 'var(--green)' }}>{product.margin_pct.toFixed(0)}%</p>}
                {product.total_sales > 0 && <p className="text-xs mt-0.5" style={{ color: 'rgba(240,235,224,0.35)' }}>{product.total_sales} sales</p>}
              </div>
            </div>
            {product.total_revenue > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="stat-label">Lifetime Revenue</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--green)' }}>${product.total_revenue.toFixed(0)}</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'var(--surface-3)' }}>
                  <div className="h-1 rounded-full" style={{ width: `${Math.min(100, (product.total_revenue / Math.max(...products.map(p => p.total_revenue || 1))) * 100}%`, background: 'var(--green)', opacity: 0.6 }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Navigation />
    </div>
  )
}
