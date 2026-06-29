export type ProviderCategory =
  | 'photography'
  | 'dj'
  | 'catering'
  | 'venue'
  | 'live_music'
  | 'decoration'
  | 'coordinator'

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  photography: 'Fotografía',
  dj: 'DJ',
  catering: 'Catering',
  venue: 'Salón',
  live_music: 'Música en Vivo',
  decoration: 'Decoración',
  coordinator: 'Coordinador de Eventos',
}

export type ProviderListing = {
  id: string
  provider_id: string
  category: ProviderCategory
  title: string
  description: string
  zone: string
  base_price_cents: number
  portfolio_urls: string[]
  technical_specs: Record<string, string> | null
  is_available: boolean
  multi_event: boolean
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
}
