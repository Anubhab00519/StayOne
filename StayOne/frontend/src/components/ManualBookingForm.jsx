import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { UserPlus, Loader2 } from 'lucide-react'

export default function ManualBookingForm({ rooms, apiBase }) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    guest_name:  '',
    guest_phone: '',
    room_id:     '',
    check_in:    today,
    check_out:   tomorrow,
  })
  const [loading, setLoading] = useState(false)

  const availableRooms = rooms
    .filter((r) => r.status === 'available')
    .sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number))

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.guest_name || !form.guest_phone || !form.room_id || !form.check_in || !form.check_out) {
      toast.error('Please fill in all fields.')
      return
    }
    if (form.check_out <= form.check_in) {
      toast.error('Check-out must be after check-in.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/bookings/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, source: 'walk_in' }),
      })
      const data = await res.json()

      if (data.success) {
        const room = rooms.find((r) => r.id === form.room_id)
        toast.success(
          `✅ Booking confirmed! Room ${room?.room_number} for ${form.guest_name}. ID: ${data.booking?.booking_id}`,
          { autoClose: 6000 }
        )
        setForm((f) => ({ ...f, guest_name: '', guest_phone: '', room_id: '' }))
      } else {
        // data.message = our conflict msg; data.detail = FastAPI HTTP error
        const errMsg = data.message || data.detail || 'Booking failed. Please try again.'
        if (data.conflict) {
          toast.error(`⚠️ Conflict: ${errMsg}`, { autoClose: 7000 })
        } else {
          toast.error(`❌ ${errMsg}`, { autoClose: 7000 })
        }
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-5 h-5 text-indigo-400" />
        <h2 className="section-title">Add Walk-in Booking</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Guest Name
            </label>
            <input
              className="input-field"
              name="guest_name"
              value={form.guest_name}
              onChange={handleChange}
              placeholder="Rahul Sharma"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Phone Number
            </label>
            <input
              className="input-field"
              name="guest_phone"
              value={form.guest_phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Room
          </label>
          <select
            className="input-field"
            name="room_id"
            value={form.room_id}
            onChange={handleChange}
            required
          >
            <option value="">Select available room…</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.room_number} — {r.type} (₹{r.price_per_night?.toLocaleString('en-IN')}/night)
              </option>
            ))}
            {availableRooms.length === 0 && (
              <option disabled>No rooms currently available</option>
            )}
          </select>
        </div>

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
              min={today}
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
              min={form.check_in || today}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing…
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </form>
    </div>
  )
}
