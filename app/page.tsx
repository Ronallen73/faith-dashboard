'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { TrendingUp, DollarSign, Package, Clock, AlertCircle, ChevronRight, Flame, Calendar, Sparkles, Settings } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import Link from 'next/link'

const VERSE = '"Whatever you do, work at it with all your heart." — Col 3:23'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 12 && h < 17) setGreeting('Good afternoon')
    else if (h >= 17) setGreeting('Good evening')
    load()
  }, [])

  async function load() {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const [salesRes, productsRes, approvalsRes, seasonsRes, settingsRes] = await Promise.all([
        supabase.from('sales').select('gross_revenue,net_profit,sale_date').gte('sale_date', monthStart),
        supabase.from('products').select('id,title,total_revenue,status'),
        supabase.from('approval_queue').select('id').eq('status', 'pending'),
        supabase.from('v_upcoming_seasons').select('*').limit(1),
        supabase.from('settings').select('tax_set_aside_pct').limit(1),
      ])
      const sales = salesRes.data || []
      const products = productsRes.data || []
      const taxRate = settingsRes.data?.[0]?.tax_set_aside_pct ? settingsRes.data[0].tax_set_aside_pct / 100 : 0.28
      const rev = sales.reduce((s:number, x:any) => s + (x.gross_revenue || 0), 0)
      const profit = sales.reduce((s:number, x:any) => s + (x.net_profit || 0), 0)
      const days: Record<string, number> = {}
      for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days[d.toISOString().slice(0,10)] = 0 }
      sales.forEach((s:any) => { const day = s.sale_date?.slice(0,10); if (day && day in days) days[day] += s.gross_revenue || 0 })
      setData({
        rev, profit, taxRate, taxSetAside: profit * taxRate,
        pending: (approvalsRes.data || []).length,
        live: products.filter((p:any) => p.status === 'live').length,
        chart: Object.entries(days).map(([date, revenue]) => ({ date, revenue })),
        season: seasonsRes.data?.[0] ? { name: seasonsRes.data[0].season_name, weeks: seasonsRes.data[0].weeks_to_peak || 0, urgency: seasonsRes.data[0].urgency } : null,
        top: products.sort((a:any, b:any) => (b.total_revenue||0)-(a.total_revenue||0))[0] || null,
      })
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => n >= 1000 ? '$' + (n/1000).toFixed(1) + 'k' : '$' + n.toFixed(0)
  const taxPct = data ? Math.round(data.taxRate * 100) : 28

  const Tip = ({ active, payload }: any) => active && payload?.length ? (
    <div style={{ background: 'var(--surface-3)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 10, padding: '8px 12px' }}>
      <p className="font-mono text-sm" style={{ color: 'var(--gold-light)' }}>{'$' + payload[0].value.toFixed(0)}</p>
    </div>
  ) : null

  return (
    <div className="min-h-dvh pb-28">
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--gold)', letterSpacing: '0.15em' }}>✦ FAITH BUSINESS</p>
            <h1 className="font-serif text-3xl font-semibold" style={{ color: 'var(--cream)', lineHeight: 1.1 }}>{greeting}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {data?.pending ? (
              <Link href="/approval">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(201,151,58,0.1)', border: '1px solid rgba(201,151,58,0.25)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)', animation: 'pulseGold 2s infinite' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--gold-light)' }}>{data.pending}</span>
                </div>
              </Link>
            ) : null}
            <Link href="/settings">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Settings size={16} style={{ color: 'rgba(240,235,224,0.4)' }} />
              </div>
            </Link>
          </div>
        </div>
        <p className="scripture-text mt-3">{VERSE}</p>
      </div>

      <div className="px-4 space-y-3 page-enter">
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="stat-label mb-3">This Month</div>
            {loading ? <div className="skeleton h-9 w-24 mb-1" /> : <div className="stat-value" style={{ color: 'var(--green)' }}>{fmt(data?.rev || 0)}</div>}
            <div className="flex items-center gap-1.5 mt-2"><DollarSign size={11} style={{ color: 'var(--green)', opacity: 0.7 }} /><span className="text-xs" style={{ color: 'rgba(76,175,125,0.6)' }}>Revenue</span></div>
          </div>
          <div className="card">
            <div className="stat-label mb-3">Profit</div>
            {loading ? <div className="skeleton h-9 w-20 mb-1" /> : <div className="stat-value" style={{ color: 'var(--gold-light)' }}>{fmt(data?.profit || 0)}</div>}
            <div className="flex items-center gap-1.5 mt-2"><TrendingUp size={11} style={{ color: 'var(--gold)', opacity: 0.7 }} /><span className="text-xs" style={{ color: 'rgba(201,151,58,0.6)' }}>Net</span></div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="stat-label">14-Day Revenue</p>
            <Sparkles size={13} style={{ color: 'var(--gold)', opacity: 0.5 }} />
          </div>
          {loading ? <div className="skeleton h-24 w-full" /> : (
            <ResponsiveContainer width="100%" height={96}>
              <AreaChart data={data?.chart || []} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9973A" stopOpacity={0.3} /><stop offset="95%" stopColor="#C9973A" stopOpacity={0} /></linearGradient></defs>
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="revenue" stroke="#C9973A" strokeWidth={2} fill="url(#gg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,144,217,0.12)' }}><Package size={18} style={{ color: 'var(--blue)' }} /></div>
            <div><div className="font-mono text-xl font-semibold" style={{ color: 'var(--cream)' }}>{loading ? '—' : data?.live}</div><div className="stat-label">Live</div></div>
          </div>
          <div className="card-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224,82,82,0.12)' }}><Clock size={18} style={{ color: 'var(--red)' }} /></div>
            <div><div className="font-mono text-xl font-semibold" style={{ color: 'var(--cream)' }}>{loading ? '—' : data?.pending}</div><div className="stat-label">Review</div></div>
          </div>
        </div>

        <div className="card" style={{ borderColor: 'rgba(201,151,58,0.2)', background: 'linear-gradient(145deg,rgba(201,151,58,0.05),#141414)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label mb-1">Set Aside for Taxes ({taxPct}%)</p>
              <p className="font-mono text-xl font-semibold" style={{ color: 'var(--gold-light)' }}>{loading ? '—' : fmt(data?.taxSetAside || 0)}</p>
            </div>
            <Link href="/tax"><div className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ color: 'rgba(201,151,58,0.6)', background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.15)' }}>Details <ChevronRight size={12} /></div></Link>
          </div>
        </div>

        {!loading && data?.season && (
          <div className="card" style={{ borderColor: 'rgba(201,151,58,0.2)', background: 'rgba(201,151,58,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,151,58,0.12)' }}>
                {data.season.urgency === 'CREATE NOW' ? <Flame size={18} style={{ color: 'var(--gold)' }} /> : <Calendar size={18} style={{ color: 'var(--gold)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-medium" style={{ color: 'var(--cream)' }}>{data.season.name}</span><span className="badge badge-gold">{data.season.urgency}</span></div>
                <p className="text-xs" style={{ color: 'rgba(240,235,224,0.45)' }}>{data.season.weeks} weeks away · Start creating now</p>
              </div>
              <Link href="/trends"><ChevronRight size={16} style={{ color: 'rgba(201,151,58,0.4)' }} /></Link>
            </div>
          </div>
        )}

        {!loading && data?.top && (
          <div className="card-sm">
            <p className="stat-label mb-2">Top Product</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate flex-1 mr-3" style={{ color: 'var(--cream)' }}>{data.top.title}</p>
              <span className="font-mono text-sm" style={{ color: 'var(--green)' }}>{fmt(data.top.total_revenue || 0)}</span>
            </div>
          </div>
        )}

        <div>
          <p className="stat-label mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/approval"><div className="action-card flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.12)' }}><AlertCircle size={17} style={{ color: 'var(--green)' }} /></div><span className="text-sm font-medium" style={{ color: 'var(--cream)' }}>Review Queue</span></div></Link>
            <Link href="/trends"><div className="action-card flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,144,217,0.12)' }}><TrendingUp size={17} style={{ color: 'var(--blue)' }} /></div><span className="text-sm font-medium" style={{ color: 'var(--cream)' }}>View Trends</span></div></Link>
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  )
}