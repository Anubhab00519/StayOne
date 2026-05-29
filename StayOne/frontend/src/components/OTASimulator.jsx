import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Zap, Loader2, AlertTriangle } from 'lucide-react'

const PLATFORMS = [
  { value: 'makemytrip', label: 'MakeMyTrip', color: 'text-red-400' },
  { value: 'goibibo',    label: 'Goibibo',    color: 'text-blue-400' },
  { value: 'booking_com', label: 'Booking.com', color: 'text-sky-400' },
]

export default function OTASimulator({ rooms, apiBase, onConflict }) {
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    platform:   'makemytrip',
    room_id:    '',
    guest_name: 'Demo OTA Guest',
    guest_phone: '+910000000000',
    check_in:    today,
    check_out:   tomorrow,
  })
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.room_id) {
      toast.error('Please select a room to simulate.')
      return
    }

    setLoading(true)
    setLastResult(null)
    try {
      const res = await fetch(`${apiBase}/bookings/ota-simulate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      setLastResult(data)

      const platformLabel = PLATFORMS.find((p) => p.value === form.platform)?.label || form.platform

      if (data.conflict) {
        // Trigger dramatic conflict animation
        onConflict(form.room_id, platformLabel, data.room_number)
        toast.error(
          `⚠️ CONFLICT BLOCKED — ${platformLabel} tried to book Room ${data.room_number}`,
          { autoClose: 7000 }
        )
      } else if (data.success) {
        toast.success(
          `✅ OTA booking confirmed — Room ${data.booking?.room_number} via ${platformLabel}`,
          { autoClose: 5000 }
        )
      } else {
        const errMsg = data.message || data.detail || 'Simulation failed.'
        toast.error(`❌ ${errMsg}`, { autoClose: 5000 })
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sortedRooms = [...rooms].sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number))

  return (
    <div className="glass-card p-5 border-amber-500/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="section-title">OTA Booking Simulator</h2>
        </div>
        <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
          Demo Tool
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4 ml-9">
        Simulate an incoming OTA booking to trigger clash detection
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Platform */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Platform
          </label>
          <select
            className="input-field"
            name="platform"
            value={form.platform}
            onChange={handleChange}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Room */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Target Room
          </label>
          <select
            className="input-field"
            name="room_id"
            value={form.room_id}
            onChange={handleChange}
            required
          >
            <option value="">Select room…</option>
            {sortedRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.room_number} — {r.type} [{r.status}]
              </option>
            ))}
          </select>
        </div>

        {/* Guest Name */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Guest Name
          </label>
          <input
            className="input-field"
            name="guest_name"
            value={form.guest_name}
            onChange={handleChange}
            placeholder="Guest name"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Check-in
            </label>
            <input
              className="input-field"
              type="date"
              name="check_in"
              value={form.check_in}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Check-out
            </label>
            <input
              className="input-field"
              type="date"
              name="check_out"
              value={form.check_out}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-orange w-full flex items-center justify-center gap-2 mt-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Simulating…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Simulate OTA Booking
            </>
          )}
        </button>
      </form>

      {/* Last result preview */}
      {lastResult && (
        <div className={`mt-3 p-3 rounded-xl border text-xs ${
          lastResult.conflict
            ? 'bg-red-500/10 border-red-500/40 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-start gap-2">
            {lastResult.conflict ? (
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            ) : (
              <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            )}
            <p className="leading-relaxed">{lastResult.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
