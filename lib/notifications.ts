import { createClient } from '@/lib/supabase/server'

type NotificationType = 'info' | 'booking' | 'payment' | 'checkin' | 'dispute'

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: NotificationType = 'info',
  link?: string
) {
  const supabase = await createClient()
  await supabase.from('notifications').insert({ user_id: userId, title, body, type, link })
}
