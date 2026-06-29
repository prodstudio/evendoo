import { create } from 'zustand'
import type { Booking, Message } from '@/types/booking'
import type { Payment } from '@/types/payment'

type BookingState = {
  activeBooking: Booking | null
  messages: Message[]
  activePayment: Payment | null
  isLoading: boolean
  setActiveBooking: (booking: Booking | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setActivePayment: (payment: Payment | null) => void
  setLoading: (loading: boolean) => void
}

export const useBookingStore = create<BookingState>((set) => ({
  activeBooking: null,
  messages: [],
  activePayment: null,
  isLoading: false,
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setActivePayment: (activePayment) => set({ activePayment }),
  setLoading: (isLoading) => set({ isLoading }),
}))
