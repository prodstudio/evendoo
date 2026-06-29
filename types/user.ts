export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_provider: boolean
  created_at: string
  updated_at: string
}

export type UserRole = 'host' | 'provider' | 'both'
