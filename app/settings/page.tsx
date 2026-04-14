'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Save, Loader2, Check, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ business_name: '', tax_set_aside_pct: 28, min_margin_pct: 60, se_tax_rate: 15.3, federal_income_bracket: 22 })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('settings').select('*').limit(1)
    const s = data?.[0]
    if (s) { setSettings(s); setForm({ business_name: s.business_name || '', tax_set_aside_pct: s.tax_set_aside_pct || 28, min_margin_pct: s.min_margin_pct || 60, se_tax_rate: s.se_tax_rate || 15.3, federal_income_bracket: s.federal_income_bracket || 22 }) }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    if (settings?.id) { await supabase.from('settings').update(form).eq('id', settings.id) }
    else { await supabase.from('settings').insert(form) }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const row = (label: string, sub: string, field: keyof typeof form, suffix = '', step = '1') => (
    <div className="card" key={field}>
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--cream)' }}>{label}</p>
          <p className="text-xs" style={{ color: 'rgba(240,235,224,0.4)' }}>{sub}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <input type={field === 'business_name' ? 'text' : 'number'} step={step} value={form[field] as any}
            onChange={e => setForm(p => ({ ...p, [field]: field === 'business_name' ? e.target.value : parseFloat(e.target.value) || 0 }))}
            className="font-mono text-right outline-none rounded-xl px-3 py-2 w-28 text-sm"
            style={{ background: 'var(--surface-3)', border: '1px solid rgba(201,151,58,0.15)', color: 'var(--cream)' }} />
          {suffix && <span className="text-sm" style={{ color: 'rgba(240,235,224,0.4)' }}>{suffix}</span>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh pb-28">
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.05)' }}><ChevronLeft size={18} style={{ color: 'rgba(240,235,224,0.5)' }} /></div></Link>
          <div><p className="stat-label" style={{ color: 'var(--gold)' }}>Configuration</p><h1 className="font-serif text-2xl" style={{ color: 'var(--cream)' }}>Settings</h1></div>
        </div>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'rgba(201,151,58,0.5)' }} /></div> : (
        <div className="px-4 space-y-3 page-enter">
          <p className="stat-label px-1">Business</p>
          {row('Business Name', 'Your store name', 'business_name')}
          <p className="stat-label px-1 mt-4">Tax Settings</p>
          {row('Tax Set-Aside Rate', '% of profit to reserve for taxes', 'tax_set_aside_pct', '%', '0.5')}
          {row('Self-Employment Tax', 'SE tax rate (typically 15.3%)', 'se_tax_rate', '%', '0.1')}
          {row('Federal Income Bracket', 'Your marginal tax bracket', 'federal_income_bracket', '%')}
          <p className="stat-label px-1 mt-4">Product Settings</p>
          {row('Minimum Margin Floor', 'Alert when margin falls below this', 'min_margin_pct', '%')}
          <div className="pt-4">
            <button onClick={save} disabled={saving || saved}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: saved ? 'rgba(76,175,125,0.15)' : 'rgba(201,151,58,0.12)', border: '1px solid ' + (saved ? 'rgba(76,175,125,0.3)' : 'rgba(201,151,58,0.3)'), color: saved ? 'var(--green)' : 'var(--gold-light)' }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
          <div className="card-sm"><p className="stat-label mb-2">How it works</p><p className="text-xs leading-relaxed" style={{ color: 'rgba(240,235,224,0.45)' }}>Changes here update your Supabase settings instantly. The tax rate on the home screen and tax page updates automatically.</p></div>
        </div>
      )}
      <Navigation />
    </div>
  )
}