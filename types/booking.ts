export enum BOOKING_STATUS {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

export type Booking = {
  id: string
  host_id: string
  provider_id: string
  listing_id: string
  event_date: string
  event_type: string
  event_zone: string
  description: string | null
  status: BOOKING_STATUS
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  booking_id: string
  sender_id: string
  body: string
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
}
