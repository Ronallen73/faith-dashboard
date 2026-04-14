'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Receipt, PiggyBank, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TaxData {
  qtdGrossRevenue: number
  qtdNetProfit: number
  estimatedTaxOwed: number
  monthlySetAside: number
  taxYear: number
  currentQuarter: number
  totalCosts: number
  platformFees: number
  subscriptions: number
}

interface QuarterlyBar {
  name: string
  revenue: number
  profit: number
}

const Q_LABELS = ['', 'Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec']
const DUE_DATES: Record<number, string> = {
  1: 'April 15',
  2: 'June 15',
  3: 'September 15',
  4: 'January 15',
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtSmall = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

export default function TaxPage() {
  const [data, setData] = useState<TaxData | null>(null)
  const [history, setHistory] = useState<QuarterlyBar[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({ se_tax_rate: 15.3, federal_income_bracket: 22, tax_set_aside_pct: 28 })

  useEffect(() => { loadTax() }, [])

  async function loadTax() {
    setLoading(true)
    const [taxPos, settingsRes, costsRes, salesHistRes] = await Promise.all([
      supabase.from('v_tax_position').select('*').single(),
      supabase.from('settings').select('*').limit(1).single(),
      supabase.from('costs').select('category,amount,tax_year,tax_quarter').eq('is_deductible', true),
      supabase.from('sales').select('gross_revenue,net_profit,tax_year,tax_quarter').eq('is_refunded', false),
    ])

    const pos = taxPos.data
    const s = settingsRes.data
    if (s) setSettings({ se_tax_rate: s.se_tax_rate, federal_income_bracket: s.federal_income_bracket, tax_set_aside_pct: s.tax_set_aside_pct })

    const costs = costsRes.data || []
    const totalCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0)
    const subscriptions = costs.filter(c => c.category?.includes('subscription')).reduce((sum, c) => sum + (c.amount || 0), 0)
    const platformFees = costs.filter(c => c.category?.includes('fee')).reduce((sum, c) => sum + (c.amount || 0), 0)

    if (pos) {
      setData({
        qtdGrossRevenue: pos.qtd_gross_revenue || 0,
        qtdNetProfit: pos.qtd_net_profit || 0,
        estimatedTaxOwed: pos.estimated_tax_owed || 0,
        monthlySetAside: pos.monthly_set_aside_needed || 0,
        taxYear: pos.tax_year || new Date().getFullYear(),
        currentQuarter: pos.current_quarter || 1,
        totalCosts,
        subscriptions,
        platformFees,
      })
    }

    const salesData = salesHistRes.data || []
    const qMap: Record<string, { revenue: number; profit: number }> = {}
    for (let q = 1; q <= 4; q++) {
      qMap[q] = { revenue: 0, profit: 0 }
    }
    salesData.forEach(s => {
      const q = s.tax_quarter || 1
      if (qMap[q]) {
        qMap[q].revenue += s.gross_revenue || 0
        qMap[q].profit += s.net_profit || 0
      }
    })
    setHistory(Object.entries(qMap).map(([q, v]) => ({ name: `Q${q}`, ...v })))
    setLoading(false)
  }

  const taxPct = data ? ((data.estimatedTaxOwed / Math.max(data.qtdGrossRevenue, 1)) * 100) : 0

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs tracking-widest uppercase text-gold-500 mb-1 font-medium">Finances</p>
        <h1 className="font-serif text-2xl text-cream">Tax Tracker</h1>
        {data && (
          <p className="text-xs mt-1" style={{ color: 'rgba(240,235,224,0.4)' }}>
            {data.taxYear} · Q{data.currentQuarter} · Due {DUE_DATES[data.currentQuarter]}
          </p>
        )}
      </div>

      <div className="px-4 space-y-4 page-enter">
        <div className="card" style={{ background: 'rgba(224,82,82,0.06)', borderColor: 'rgba(224,82,82,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
              <span className="text-sm font-semibold text-cream">Estimated Tax Due</span>
            </div>
            <span className="badge badge-red">Q{data?.currentQuarter}</span>
          </div>
          {loading ? (
            <div className="skeleton h-12 w-40" />
          ) : (
            <div className="font-mono text-4xl font-medium mb-1" style={{ color: 'var(--red)' }}>
              {fmt(data?.estimatedTaxOwed || 0)}
            </div>
          )}
          <p className="text-xs" style={{ color: 'rgba(240,235,224,0.4)' }}>
            ~28% of net profit · self-employment + income tax
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank size={16} style={{ color: 'var(--gold)' }} />
            <span className="text-sm font-semibold text-cream">Monthly Set-Aside</span>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="font-mono text-2xl font-medium" style={{ color: 'var(--gold-light)' }}>
                {loading ? '—' : fmt(data?.monthlySetAside || 0)}
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(240,235,224,0.4)' }}>per month recommended</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg" style={{ color: 'rgba(240,235,224,0.6)' }}>
                {settings.tax_set_aside_pct}%
              </div>
              <p className="text-xs" style={{ color: 'rgba(240,235,224,0.3)' }}>set-aside rate</p>
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'var(--surface-3)' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, taxPct)}%`, background: 'var(--gold)' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(240,235,224,0.35)' }}>
            Tax = {taxPct.toFixed(1)}% of gross revenue
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card-sm">
            <p className="stat-label mb-2">QTD R;evenue</p>
            <p className="font-mono text-lg font-medium" style={{ color: 'var(--green)' }}>
              {loading ? '—' : fmt(data?.qtdGrossRevenue || 0)}
            </p>
          </div>
          <div className="card-sm">
            <p className="stat-label mb-2">QTD Profit</p>
            <p className="font-mono text-lg font-medium" style={{ color: 'var(--gold-light)' }}>
              {loading ? '—' : fmt(data?.qtdNetProfit || 0)}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
            <span className="text-sm font-semibold text-cream">Deductible Expenses</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Costs', value: data?.totalCosts || 0 },
              { label: 'Subscriptions', value: data?.subscriptions || 0 },
              { label: 'Platform Fees', value: data?.platformFees || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(240,235,224,0.5)' }}>{label}</span>
                <span className="font-mono text-sm" style={{ color: 'var(--green)', opacity: 0.85 }}>
                  {loading ? '—' : fmtSmall(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: 'var(--blue)' }} />
              <span className="text-sm font-semibold text-cream">Revenue by Quarter</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(240,235,224,0.35)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--surface-4)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--cream)' }}
                  formatter={(v: number) => [`$${v.toFixed(0)}`, '']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {history.map((entry, i) => (
                    <Cell key={i}
                      fill={data?.currentQuarter === i + 1 ? 'var(--gold)' : 'rgba(201,151,58,0.3)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-start gap-2.5 p-4 rounded-xl"
          style={{ background: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.15)' }}>
          <Info size={14} style={{ color: 'var(--blue)', marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,235,224,0.5)' }}>
            Estimates based on {settings.se_tax_rate}% self-employment + {settings.federal_income_bracket}% federal bracket.
            Consult a tax professional for filing.
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  )
}
