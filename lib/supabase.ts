import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ProductType =
  | 'digital_download' | 'pod_physical' | 'kdp_book'
  | 'notion_template' | 'canva_template' | 'svg_cut_file'
  | 'spreadsheet_template'

export type ProductStatus =
  | 'idea' | 'pending_image' | 'pending_approval' | 'approved'
  | 'ready_to_publish' | 'live' | 'paused' | 'archived'

export type Platform =
  | 'etsy_digital' | 'etsy_pod' | 'amazon_merch' | 'kdp' | 'pinterest'

export type ApprovalItemType =
  | 'product_idea' | 'generated_image' | 'listing_copy'
  | 'customer_reply' | 'trend_alert' | 'price_change' | 'tax_reminder'

export type ApprovalStatus =
  | 'pending' | 'approved' | 'rejected' | 'edited_and_approved'

export interface Product {
  id: string
  title: string
  description?: string
  product_type: ProductType
  status: ProductStatus
  platform?: Platform
  list_price?: number
  net_profit?: number
  margin_pct?: number
  total_sales: number
  total_revenue: number
  image_url?: string
  christian_theme?: string
  created_at: string
}

export interface Sale {
  id: string
  product_id?: string
  platform: Platform
  sale_date: string
  gross_revenue: number
  net_profit: number
  tax_year?: number
  tax_quarter?: number
}

export interface ApprovalItem {
  id: string
  product_id?: string
  item_type: ApprovalItemType
  status: ApprovalStatus
  priority: number
  title: string
  summary?: string
  image_url?: string
  firefly_prompt?: string
  proposed_title?: string
  proposed_description?: string
  proposed_price?: number
  created_at: string
}

export interface Trend {
  id: string
  trend_name: string
  category?: string
  trend_date: string
  opportunity_score?: number
  competition_level?: string
  product_ideas?: string[]
  peak_date?: string
  weeks_until_peak?: number
  trending_up: boolean
  recommended_action?: string
}

export interface Settings {
  id: string
  business_name: string
  min_margin_pct: number
  tax_set_aside_pct: number
  se_tax_rate: number
  federal_income_bracket: number
}

export interface SeasonalEvent {
  id: string
  season_name: string
  peak_date: string
  start_creating_date: string
  category: string
  product_suggestions: string[]
  keywords: string[]
  days_to_peak?: number
  weeks_to_peak?: number
  urgency?: string
}
