import React, { useState } from 'react'
import { Camera, X } from 'lucide-react'

const STATUS_CONFIG = {
  available: {
    label:      'Available',
    cardBorder: 'border-emerald-500/40',
    cardBg:     'bg-emerald-500/5',
    badge:      'badge-green',
    dot:        'bg-emerald-400',
  },
  booked: {
    label:      'Booked',
    cardBorder: 'border-red-500/60',
    cardBg:     'bg-red-500/10',
    badge:      'badge-red',
    dot:        'bg-red-400',
  },
  pending: {
    label:      'Pending',
    cardBorder: 'border-amber-500/40',
    cardBg:     'bg-amber-500/5',
    badge:      'badge-yellow',
    dot:        'bg-amber-400',
  },
  blocked: {
    label:      'Blocked',
    cardBorder: 'border-slate-500/40',
    cardBg:     'bg-slate-500/5',
    badge:      'badge-blue',
    dot:        'bg-slate-400',
  },
}

function RoomCard({ room, isConflict }) {
  const [photoHover, setPhotoHover] = useState(false)
  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.available

  return (
    <div
      className={`
        room-card border-2 ${cfg.cardBorder} ${cfg.cardBg}
        ${isConflict ? 'flash-conflict' : ''}
        relative overflow-hidden
      `}
    >
      {/* Photo preview on hover */}
      {photoHover && room.photo_url && (
        <div className="absolute inset-0 z-20 rounded-2xl overflow-hidden animate-fade-in">
          <img
            src={room.photo_url}
            alt={`Room ${room.room_number}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white font-bold text-lg">Room {room.room_number}</p>
            <p className="text-slate-200 text-xs">{room.type}</p>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-3xl font-black text-slate-100 leading-none">{room.room_number}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{room.type}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`badge ${cfg.badge} text-[11px]`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {/* Camera icon */}
            {room.photo_url && (
              <button
                onMouseEnter={() => setPhotoHover(true)}
                onMouseLeave={() => setPhotoHover(false)}
                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/70 transition-colors"
                title="View room photo"
              >
                <Camera className="w-3.5 h-3.5 text-slate-300" />
              </button>
            )}
          </div>
        </div>

        {/* Price */}
        <p className="text-sm font-bold text-slate-300">
          ₹{room.price_per_night?.toLocaleString('en-IN')}<span className="text-slate-500 font-normal">/night</span>
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mt-2">
          {(room.amenities || []).slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded-md">
              {a}
            </span>
          ))}
          {(room.amenities || []).length > 3 && (
            <span className="text-[10px] bg-slate-700/60 text-slate-500 px-1.5 py-0.5 rounded-md">
              +{(room.amenities || []).length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RoomGrid({ rooms, conflictRoomId }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  // Sort by room number
  const sortedRooms = [...rooms].sort((a, b) =>
    parseInt(a.room_number) - parseInt(b.room_number)
  )

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Room Availability</h2>
        <span className="text-xs text-slate-500 font-medium">{today}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isConflict={conflictRoomId === room.id}
          />
        ))}
      </div>
    </div>
  )
}
