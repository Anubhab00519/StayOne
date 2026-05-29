import React from 'react'
import { TrendingUp, Percent, DoorOpen, IndianRupee } from 'lucide-react'

export default function StatsRow({ stats }) {
  const { todayBookings, totalRooms, bookedRooms, revenueToday } = stats
  const availableRooms = totalRooms - bookedRooms
  const occupancyPct   = totalRooms ? Math.round((bookedRooms / totalRooms) * 100) : 0

  const cards = [
    {
      label:   "Today's Bookings",
      value:   todayBookings,
      icon:    TrendingUp,
      color:   'emerald',
      suffix:  '',
      badge:   todayBookings > 0 ? '+' + todayBookings : '—',
      bgGlow:  'from-emerald-500/20 to-transparent',
      iconBg:  'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label:   'Current Occupancy',
      value:   occupancyPct + '%',
      icon:    Percent,
      color:   'indigo',
      suffix:  '',
      progress: occupancyPct,
      bgGlow:  'from-indigo-500/20 to-transparent',
      iconBg:  'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
    },
    {
      label:   'Available Rooms',
      value:   availableRooms,
      icon:    DoorOpen,
      color:   'sky',
      suffix:  ` / ${totalRooms}`,
      bgGlow:  'from-sky-500/20 to-transparent',
      iconBg:  'bg-sky-500/20',
      iconColor: 'text-sky-400',
    },
    {
      label:   'Revenue Today',
      value:   '₹' + (revenueToday || 0).toLocaleString('en-IN'),
      icon:    IndianRupee,
      color:   'amber',
      suffix:  '',
      bgGlow:  'from-amber-500/20 to-transparent',
      iconBg:  'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="stat-card relative overflow-hidden"
          >
            {/* Glow backdrop */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGlow} pointer-events-none`} />

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-tight">
                  {card.label}
                </p>
                <div className={`${card.iconBg} p-2 rounded-xl`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>

              <p className="text-3xl font-black text-slate-100 leading-none">
                {card.value}
                {card.suffix && (
                  <span className="text-lg font-semibold text-slate-400 ml-1">{card.suffix}</span>
                )}
              </p>

              {/* Progress bar for occupancy */}
              {card.progress !== undefined && (
                <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}

              {/* Badge */}
              {card.badge && (
                <div className="mt-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {card.badge} today
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
