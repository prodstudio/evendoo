import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      provider_listings(title, base_price_cents, category),
      profiles!bookings_provider_id_fkey(full_name),
      host_profiles:profiles!bookings_host_id_fkey(full_name)
    `)
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.host_id !== user.id && booking.provider_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at')

  const providerName = (booking.profiles as any)?.full_name ?? 'Proveedor'
  const hostName = (booking.host_profiles as any)?.full_name ?? 'Host'
  const listingTitle = (booking.provider_listings as any)?.title ?? 'Servicio'
  const basePrice = (booking.provider_listings as any)?.base_price_cents ?? 0
  const eventDate = new Date(booking.event_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const issueDate = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const invoiceNum = bookingId.slice(0, 8).toUpperCase()

  const deposit = payment?.find((p: any) => p.type === 'deposit')
  const balance = payment?.find((p: any) => p.type === 'balance')
  const depositAmount = deposit ? (deposit.amount_cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 0 }) : '—'
  const balanceAmount = balance ? (balance.amount_cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 0 }) : '—'
  const total = (basePrice / 100).toLocaleString('es-AR', { minimumFractionDigits: 0 })

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Factura ${invoiceNum} — Evendoo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C0F0A; background: #fff; padding: 40px; max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 28px; font-weight: 900; color: #E8533A; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .invoice-meta p { font-size: 13px; color: #8C7B75; }
  .divider { height: 1px; background: #F0E6DF; margin: 24px 0; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .party label { font-size: 11px; font-weight: 600; color: #8C7B75; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
  .party p { font-size: 15px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; font-size: 11px; font-weight: 600; color: #8C7B75; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 0; border-bottom: 1px solid #F0E6DF; }
  td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #F9F3EE; }
  .totals { margin-left: auto; width: 240px; }
  .totals .row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; }
  .totals .row.total { font-size: 17px; font-weight: 700; border-top: 2px solid #1C0F0A; padding-top: 10px; margin-top: 4px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #FFF0ED; color: #E8533A; }
  .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #8C7B75; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<button class="no-print" onclick="window.print()" style="position:fixed;top:16px;right:16px;padding:8px 20px;background:#E8533A;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">
  Guardar PDF
</button>

<div class="header">
  <div class="brand">Evendoo</div>
  <div class="invoice-meta">
    <h2>Factura</h2>
    <p>Nº ${invoiceNum}</p>
    <p>Emitida: ${issueDate}</p>
  </div>
</div>

<div class="parties">
  <div class="party">
    <label>Proveedor</label>
    <p>${esc(providerName)}</p>
  </div>
  <div class="party">
    <label>Cliente (Host)</label>
    <p>${esc(hostName)}</p>
  </div>
</div>

<div class="divider"></div>

<table>
  <thead>
    <tr>
      <th>Descripción</th>
      <th>Fecha del evento</th>
      <th>Zona</th>
      <th style="text-align:right">Importe</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${esc(listingTitle)}<br><small style="color:#8C7B75">${esc(booking.event_type)}</small></td>
      <td>${eventDate}</td>
      <td>${esc(booking.event_zone)}</td>
      <td style="text-align:right;font-weight:600">$${total}</td>
    </tr>
  </tbody>
</table>

<div class="totals">
  <div class="row">
    <span>Seña abonada</span>
    <span>$${depositAmount}</span>
  </div>
  <div class="row">
    <span>Saldo</span>
    <span>$${balanceAmount}</span>
  </div>
  <div class="row total">
    <span>Total</span>
    <span>$${total}</span>
  </div>
</div>

<div class="divider"></div>

<div class="footer">
  <p>Este documento fue generado por Evendoo · plataforma de gestión de eventos</p>
  <p style="margin-top:4px">Reserva ID: ${bookingId}</p>
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
