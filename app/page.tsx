'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import {
  TrendingUp, DollarSign, Package, Clock, AlertCircle,
  ChevronRight, Flame, Calendar, Sparkles
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import Link from 'next/link'

interface DashboardData {
  totalRevenueMonth: number
  totalProfitMonth: number
  pendingApprovals: number
  liveProducts: number
  recentSales: { date: string; revenue: number }[]
  upcomingSeason: { name: string; weeks: number; urgency: string } | null
  taxSetAside: number
  topProduct: { title: string; revenue: number } | null
}

const formatCurrency = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`

const VERSE = '"Whatever you do, work at it with all your heart." â Col 3:23'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 12 && h < 17) setGreeting('Good afternoon')
    else if (h >= 17) setGreeting('Good evening')
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [salesRes, productsRes, approvalsRes, seasonsRes] = await Promise.all([
        supabase.from('sales').select('gross_revenue,net_profit,sale_date,product_id').gte('sale_date', monthStart).eq('is_refunded', false),
        supabase.from('products').select('id,title,total_revenue,status'),
        supabase.from('approval_queue').select('id').eq('status', 'pending'),
        supabase.from('v_upcoming_seasons').select('*').limit(1),
      ])

      const sales = salesRes.data || []
      const products = productsRes.data || []
      const approvals = approvalsRes.data || []
      const seasons = seasonsRes.data || []

      const totalRevenueMonth = sales.reduce((s, x) => s + (x.gross_revenue || 0), 0)
      const totalProfitMonth = sales.reduce((s, x) => s + (x.net_profit || 0), 0)

      const days: Record<string, number> = {}
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        days[d.toISOString().slice(0, 10)] = 0
      }
      sales.forEach(s => {
        const day = s.sale_date?.slice(0, 10)
        if (day && day in days) days[day] += s.gross_revenue || 0
      })
      const recentSales = Object.entries(days).map(([date, revenue]) => ({ date, revenue }))

      const liveProducts = products.filter(p => p.status === 'live').length
      const topProduct = products.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))[0] || null

      const taxSetAside = totalProfitMonth * 0.28

      const upcomingSeason = seasons[0]
        ? { name: seasons[0].season_name, weeks: seasons[0].weeks_to_peak || 0, urgency: seasons[0].urgency }
        : null

      setData({
        totalRevenueMonth, totalProfitMonth, pendingApprovals: approvals.length,
        liveProducts, recentSales, upcomingSeason, taxSetAside,
        topProduct: topProduct ? { title: topProduct.title, revenue: topProduct.total_revenue || 0 } : null,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-surface-3 border border-surface-4 rounded-lg px-3 py-2">
          <p className="font-mono text-gold-400 text-sm">${payload[0].value.toFixed(0)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-dvh pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs tracking-widest uppercase text-gold-500 mb-1 font-medium">Faith Business</p>
            <h1 className="font-serif text-2xl text-cream">{greeting} â</h1>
          </div>
          {data?.pendingApprovals ? (
            <Link href="/approval">
              <div className="relative flex items-center gap-2 bg-surface-2 border border-gold-600/40 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse-gold" />
                <span className="text-gold-400 text-sm font-medium">{data.pendingApprovals} pending</span>
              </div>
            </Link>
          ) : null}
        </div>
        <p className="scripture-text mt-3">{VERSE}</p>
      </div>

      <div className="px-4 space-y-4 page-enter">

        {/* Revenue + Profit row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="stat-label mb-3">This Month</div>
            {loading ? (
              <div className="skeleton h-8 w-24 mb-1" />
            ) : (
              <div className="stat-value text-green-400" style={{ color: 'var(--green)' }}>
                {formatCurrency(data?.totalRevenueMonth || 0)}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              <DollarSign size={12} style={{ color: 'var(--green)' }} />
              <span className="text-xs" style={{ color: 'rgba(76,175,125,0.7)' }}>Revenue</span>
            </div>
          </div>

          <div className="card">
            <div className="stat-label mb-3">Profit</div>
            {loading ? (
              <div className="skeleton h-8 w-20 mb-1" />
            ) : (
              <div className="stat-value" style={{ color: 'var(--gold-light)' }}>
                {formatCurrency(data?.totalProfitMonth || 0)}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={12} style={{ color: 'var(--gold)' }} />
              <span className="text-xs" style={{ color: 'rgba(201,151,58,0.7)' }}>Net</span>
            </div>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="stat-label">14-Day Revenue</p>
            </div>
            <Sparkles size={14} style={{ color: 'var(--gold)', opacity: 0.6 }} />
          </div>
          {loading ? (
            <div className="skeleton h-28 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={112}>
              <AreaChart data={data?.recentSales || []} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9973A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C9973A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="revenue"
                  stroke="#C9973A" strokeWidth={1.5}
                  fill="url(#goldGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(74,144,217,0.15)' }}>
              <Package size={18} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div className="font-mono text-xl font-medium text-cream">{loading ? 'â' : data?.liveProducts}</div>
              <div className="stat-label">Live Products</div>
            </div>
          </div>

          <div className="card-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(224,82,82,0.15)' }}>
              <Clock size={18} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <div className="font-mono text-xl font-medium text-cream">{loading ? 'â' : data?.pendingApprovals}</div>
              <div className="stat-label">Need Review</div>
            </div>
          </div>
        </div>

        {/* Tax set-aside */}
        <div className="card border-dashed" style={{ borderColor: 'rgba(201,151,58,0.3)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label mb-1">Set Aside for Taxes (28%)</p>
              <p className="font-mono text-lg font-medium" style={{ color: 'var(--gold-light)' }}>
                {loading ? 'â' : formatCurrency(data?.taxSetAside || 0)}
              </p>
            </div>
            <Link href="/tax">
              <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(201,151,58,0.6)' }}>
                <span>Details</span>
                <ChevronRight size={12} />
              </div>
            </Link>
          </div>
        </div>

        {/* Seasonal alert */}
        {!loading && data?.upcomingSeason && (
          <div className="card" style={{ background: 'rgba(201,151,58,0.06)', borderColor: 'rgba(201,151,58,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,151,58,0.15)' }}>
                {data.upcomingSeason.urgency === 'CREATE NOW' ? (
                  <Flame size={18} style={{ color: 'var(--gold)' }} />
                ) : (
                  <Calendar size={18} style={{ color: 'var(--gold)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-cream">{data.upcomingSeason.name}</span>
                  <span className="badge badge-gold">{data.upcomingSeason.urgency}</span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(240,235,224,0.5)' }}>
                  {data.upcomingSeason.weeks} weeks away Â· Start creating now
                </p>
              </div>
              <Link href="/trends">
                <ChevronRight size={16} style={{ color: 'rgba(201,151,58,0.5)' }} />
              </Link>
            </div>
          </div>
        )}

        {/* Top product */}
        {!loading && data?.topProduct && (
          <div className="card-sm">
            <p className="stat-label mb-2">Top Product</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-cream font-medium truncate flex-1 mr-3">{data.topProduct.title}</p>
              <span className="font-mono text-sm" style={{ color: 'var(--green)' }}>
                {formatCurrency(data.topProduct.revenue)}
              </span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="pt-2">
          <p className="stat-label mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/approval">
              <div className="card-sm flex items-center gap-3 active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(76,175,125,0.15)' }}>
                  <AlertCircle size={16} style={{ color: 'var(--green)' }} />
                </div>
                <span className="text-sm font-medium">Review Queue</span>
              </div>
            </Link>
            <Link href="/trends">
              <div className="card-sm flex items-center gap-3 active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(74,144,217,0.15)' }}>
                  <TrendingUp size={16} style={{ color: 'var(--blue)' }} />
                </div>
                <span className="text-sm font-medium">View Trends</span>
              </div>
            </Link>
          </div>
        </div>

      </div>

      <Navigation />
    </div>
  )
}
