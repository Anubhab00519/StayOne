import React, { useRef, useEffect } from 'react'
import { MessageCircle, User, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'

// Source icons
function SourceIcon({ source }) {
  const base = 'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0'
  switch (source) {
    case 'whatsapp':
      return (
        <div className={`${base} bg-emerald-500/20 border border-emerald-500/40`}>
          <MessageCircle className="w-4 h-4 text-emerald-400" />
        </div>
      )
    case 'makemytrip':
      return (
        <div className={`${base} bg-red-500/20 border border-red-500/40 text-red-400`}>
          M
        </div>
      )
    case 'goibibo':
      return (
        <div className={`${base} bg-blue-500/20 border border-blue-500/40 text-blue-400`}>
          G
        </div>
      )
    case 'booking_com':
      return (
        <div className={`${base} bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[10px]`}>
          B.com
        </div>
      )
    case 'walk_in':
    default:
      return (
        <div className={`${base} bg-purple-500/20 border border-purple-500/40`}>
          <User className="w-4 h-4 text-purple-400" />
        </div>
      )
  }
}

function sourceName(source) {
  const map = {
    whatsapp:    'WhatsApp',
    makemytrip:  'MakeMyTrip',
    goibibo:     'Goibibo',
    booking_com: 'Booking.com',
    walk_in:     'Walk-in',
  }
  return map[source] || source
}

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function BookingItem({ booking, isNew }) {
  const isConflict = booking.status === 'rejected' || booking.conflict_detected

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-xl border transition-all
        ${isNew ? 'animate-new-item' : ''}
        ${isConflict
          ? 'bg-red-500/8 border-red-500/30'
          : 'bg-slate-800/50 border-slate-700/40 hover:border-slate-600/60'}
      `}
    >
      <SourceIcon source={booking.source} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-200 truncate">{booking.guest_name}</p>
          <span className="text-[11px] text-slate-500 flex-shrink-0">{timeAgo(booking.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span className="font-medium">Room {booking.room_number || booking.room_id?.replace('room_', '')}</span>
          <span className="text-slate-600">•</span>
          <span>{booking.check_in} → {booking.check_out}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Platform badge */}
            <span className="text-[11px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded-md">
              {sourceName(booking.source)}
            </span>
            {/* Amount */}
            <span className="text-[11px] font-bold text-slate-300">
              ₹{(booking.total_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Status badge */}
          {isConflict ? (
            <span className="badge badge-red gap-1">
              <AlertTriangle className="w-3 h-3" />
              Conflict Blocked
            </span>
          ) : booking.status === 'confirmed' ? (
            <span className="badge badge-green gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Confirmed
            </span>
          ) : booking.status === 'checked_out' ? (
            <span className="badge badge-blue">Checked Out</span>
          ) : (
            <span className="badge badge-yellow">{booking.status}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingFeed({ bookings }) {
  const prevCountRef = useRef(bookings.length)
  const newIds = useRef(new Set())

  // Track which booking IDs are new
  useEffect(() => {
    if (bookings.length > prevCountRef.current) {
      const newOnes = bookings.slice(0, bookings.length - prevCountRef.current)
      newOnes.forEach((b) => newIds.current.add(b.id))
      // Remove new flag after animation
      setTimeout(() => {
        newOnes.forEach((b) => newIds.current.delete(b.id))
      }, 600)
    }
    prevCountRef.current = bookings.length
  }, [bookings])

  return (
    <div className="glass-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Live Booking Feed</h2>
        <span className="text-xs text-slate-500 font-medium">{bookings.length} total</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-80 pr-1">
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No bookings yet</p>
            <p className="text-xs mt-1">Bookings will appear here in real time</p>
          </div>
        ) : (
          bookings.map((b) => (
            <BookingItem
              key={b.id}
              booking={b}
              isNew={newIds.current.has(b.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
