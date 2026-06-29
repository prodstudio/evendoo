import type { PostgrestError } from '@supabase/supabase-js'
import type { AppError } from '@/types/api'

export function normalizeSupabaseError(error: PostgrestError): AppError {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
  }
}

export function normalizeAuthError(error: Error): AppError {
  return {
    code: 'AUTH_ERROR',
    message: error.message,
  }
}
