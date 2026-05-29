import React from 'react'
import { Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

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

function NotifIcon({ type }) {
  if (type === 'conflict_detected') return <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
  if (type === 'booking_confirmed') return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
  return <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
}

export default function NotificationPanel({ notifications }) {
  const unread = notifications.filter((n) => !n.read)

  return (
    <div className="glass-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="section-title">Alerts</h2>
          {unread.length > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread.length}
            </span>
          )}
        </div>
        <Bell className="w-4 h-4 text-slate-500" />
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-64 pr-1">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No alerts yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isConflict = n.type === 'conflict_detected'
            return (
              <div
                key={n.id}
                className={`
                  flex items-start gap-2.5 p-3 rounded-xl border text-sm animate-new-item
                  ${isConflict
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-emerald-500/5 border-emerald-500/20'}
                `}
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${isConflict ? 'text-red-200' : 'text-slate-300'}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
