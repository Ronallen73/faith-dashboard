'use client'
import { useEffect, useState } from 'react'
import { supabase, type Trend, type SeasonalEvent } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Flame, Calendar, TrendingUp, ChevronRight, Zap, Clock } from 'lucide-react'

const urgencyColor = (u: string) => {
  if (u === 'CREATE NOW') return 'var(--red)'
  if (u === 'STARTING SOON') return 'var(--gold)'
  return 'rgba(240,235,224,0.4)'
}
const urgencyBg = (u: string) => {
  if (u === 'CREATE NOW') return 'rgba(224,82,82,0.12)'
  if (u === 'STARTING SOON') return 'rgba(201,151,58,0.12)'
  return 'rgba(240,235,224,0.05)'
}
const scoreColor = (s: number) => {
  if (s >= 8) return 'var(--green)'
  if (s >= 6) return 'var(--gold)'
  return 'rgba(240,235,224,0.5)'
}
export default function TrendsPage() {
  const [seasons, setSeasons] = useState<SeasonalEvent[]>([])
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null)
  useEffect(() => { loadData() }, [])
  async function loadData() {
    setLoading(true)
    const [seasonsRes, trendsRes] = await Promise.all([
      supabase.from('v_upcoming_seasons').select('*'),
      supabase.from('trends').select('*').order('opportunity_score', { ascending: false }).limit(20),
    ])
    setSeasons(seasonsRes.data || [])
    setTrends(trendsRes.data || [])
    setLoading(false)
  }
  return (
    <div className="min-h-dvh pb-24">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs tracking-widest uppercase text-gold-500 mb-1 font-medium">Intelligence</p>
        <h1 className="font-serif text-2xl text-cream">Trends &amp; Seasons</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(240,235,224,0.4)' }}>Your seasonal content calendar and market opportunities</p>
      </div>
      <div className="px-4 space-y-6 page-enter">
        <section>
          <div className="flex items-center gap-2 mb-3"><Calendar size={14} style={{ color: 'var(--gold)' }} /><h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--gold)' }}>Seasonal Calendar</h2></div>
          <div className="space-y-2">
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)
            : seasons.length === 0 ? <div className="card text-center py-8"><p className="text-sm" style={{ color: 'rgba(240,235,224,0.35)' }}>No upcoming seasons</p></div>
            : seasons.map(season => {
              const isExpanded = expandedSeason === season.id
              const urgency = season.urgency || 'UPCOMING'
              return (
                <div key={season.id} className="overflow-hidden rounded-2xl border transition-all"
                  style={{ background: urgencyBg(urgency), borderColor: urgency === 'CREATE NOW' ? 'rgba(224,82,82,0.25)' : urgency === 'STARTING SOON' ? 'rgba(201,151,58,0.25)' : 'var(--surface-3)' }}>
                  <button onClick={() => setExpandedSeason(isExpanded ? null : season.id)} className="w-full flex items-center gap-3 p-4 text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${urgencyColor(urgency)}18` }}>
                      {urgency === 'CREATE NOW' ? <Flame size={18} style={{ color: urgencyColor(urgency) }} /> : <Calendar size={18} style={{ color: urgencyColor(urgency) }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-medium text-cream">{season.season_name}</span><span className="badge text-[9px] px-2 py-0.5" style={{ background: `${urgencyColor(urgency)}18`, color: urgencyColor(urgency), border: `1px solid ${urgencyColor(urgency)}30` }}>{urgency}</span></div>
                      <p className="text-xs" style={{ color: 'rgba(240,235,224,0.45)' }}>{season.weeks_to_peak} weeks · Peak {new Date(season.peak_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <ChevronRight size={16} className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} style={{ color: 'rgba(240,235,224,0.3)' }} />
                  </button>
                  {isExpanded && <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="pt-3"><p className="stat-label mb-2">Product Ideas</p><div className="flex flex-wrap gap-2">{season.product_suggestions?.map((s, i) => <span key={i} className="badge badge-gold">{s}</span>)}</div></div>
                    {season.keywords?.length > 0 && <div><p className="stat-label mb-2">Keywords</p><div className="flex flex-wrap gap-1.5">{season.keywords.map((k, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface-3)', color: 'rgba(240,235,224,0.5)' }}>{k}</span>)}</div></div>}
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(240,235,224,0.4)' }}><Clock size={11} /><span>Start by {new Date(season.start_creating_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span></div>
                  </div>}
                </div>
              )
            })}
          </div>
        </section>
        <section>
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={14} style={{ color: 'var(--blue)' }} /><h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--blue)' }}>Market Trends</h2></div>
          {trends.length === 0 && !loading ? (
            <div className="card text-center py-8"><Zap size={24} style={{ color: 'rgba(201,151,58,0.3)' }} className="mx-auto mb-3" /><p className="text-sm font-medium text-cream mb-1">No trends yet</p><p className="text-xs" style={{ color: 'rgba(240,235,224,0.35)' }}>Claude 2 will populate this automatically</p></div>
          ) : (
            <div className="space-y-2">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20" />)
              : trends.map(trend => (
                <div key={trend.id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5"><p className="text-sm font-medium text-cream">{trend.trend_name}</p>{trend.trending_up && <TrendingUp size={12} style={{ color: 'var(--green)' }} />}</div>
                      {trend.category && <span className="text-xs" style={{ color: 'rgba(240,235,224,0.4)' }}>{trend.category}</span>}
                      {trend.recommended_action && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(240,235,224,0.55)' }}>{trend.recommended_action}</p>}
                      {trend.product_ideas?.length && <div className="flex flex-wrap gap-1.5 mt-2">{trend.product_ideas.slice(0, 3).map((idea, i) => <span key={i} className="badge badge-gold">{idea}</span>)}</div>}
                    </div>
                    {trend.opportunity_score && <div className="text-right flex-shrink-0"><p className="font-mono text-lg font-medium" style={{ color: scoreColor(trend.opportunity_score) }}>{trend.opportunity_score}</p><p className="text-[10px]" style={{ color: 'rgba(240,235,224,0.3)' }}>score</p></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Navigation />
    </div>
  )
}
