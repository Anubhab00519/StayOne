import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function App() {
  const [page, setPage] = useState('login') // login | register | dashboard
  const [hotel, setHotel] = useState(null)

  if (page === 'login') return <Login onLogin={h => { setHotel(h); setPage('dashboard') }} onRegister={() => setPage('register')} />
  if (page === 'register') return <Register onBack={() => setPage('login')} onSuccess={h => { setHotel(h); setPage('dashboard') }} />
  if (page === 'dashboard') return <Dashboard hotel={hotel} onLogout={() => { setHotel(null); setPage('login') }} />
}

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await axios.post(`${API}/hotels/login`, { email, password })
      onLogin(res.data.hotel)
    } catch (e) { setError(e.response?.data?.error || 'Login failed') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f2027 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'rgba(16,185,129,0.07)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 300, height: 300, background: 'rgba(59,130,246,0.07)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 440, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 24, padding: 40, backdropFilter: 'blur(20px)', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>S1</div>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: -1 }}>StayOne</span>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 15 }}>Hotel Manager Dashboard</p>
        </div>
        <form onSubmit={login}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@hotel.com"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', marginBottom: 12 }}>
            {loading ? 'Signing in...' : 'Access Dashboard'}
          </button>
        </form>
        <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 20, textAlign: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>New hotel manager? </span>
          <button onClick={onRegister} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Register your hotel →</button>
        </div>
      </div>
    </div>
  )
}

function Register({ onBack, onSuccess }) {
  const [form, setForm] = useState({ name: '', city: '', location: '', owner_email: '', password: '', owner_phone: '', mmt_hotel_code: '', goibibo_hotel_code: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const register = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await axios.post(`${API}/hotels/register`, form)
      setResult(res.data)
    } catch (e) { setError(e.response?.data?.error || 'Registration failed') }
    setLoading(false)
  }

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 560, width: '100%', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 24, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 8px' }}>Hotel Registered!</h2>
          <p style={{ color: '#94a3b8', marginBottom: 28 }}>{result.hotel.name} is now on StayOne.</p>

          <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ color: '#10b981', fontWeight: 800, fontSize: 16, marginBottom: 10 }}>✅ Linked to OTAs successfully</div>
            <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              Your hotel is now acting as the central inventory master. Any bookings on MakeMyTrip or Goibibo will automatically be tracked here and synced instantly.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onSuccess(result.hotel)}
              style={{ flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, cursor: 'pointer' }}>
              Open My Dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 540, width: '100%', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 24, padding: 40 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', marginBottom: 24, fontSize: 13 }}>← Back to Login</button>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 24, margin: '0 0 6px' }}>Register Your Hotel</h2>
        <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 14 }}>Enter your OTA Hotel Codes below to link your inventory automatically.</p>
        <form onSubmit={register}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
            {[
              ['name','Hotel Name','Grand Hotel'],['city','City','Mumbai'],
              ['location','Area / Location','Andheri West'],['owner_email','Owner Email','manager@hotel.com'],
              ['password','Password','Min 6 characters'],['owner_phone','Phone Number','+91 9876543210']
            ].map(([key, label, ph]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</label>
                <input type={key === 'password' ? 'password' : key === 'owner_email' ? 'email' : 'text'} placeholder={ph}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key !== 'owner_phone'}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: 14 }}>🔗 Connect OTAs (Optional)</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#f87171', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>MakeMyTrip Code</label>
                <input placeholder="e.g. MMT-1234" value={form.mmt_hotel_code} onChange={e => setForm({ ...form, mmt_hotel_code: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#fb923c', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Goibibo Code</label>
                <input placeholder="e.g. GOI-5678" value={form.goibibo_hotel_code} onChange={e => setForm({ ...form, goibibo_hotel_code: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 4 }}>
            {loading ? 'Registering...' : 'Register & Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Dashboard({ hotel, onLogout }) {
  const [analytics, setAnalytics] = useState(null)
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('overview')

  const fetchData = async () => {
    try {
      const [a, b] = await Promise.all([
        axios.get(`${API}/analytics/${hotel.id}`),
        axios.get(`${API}/bookings/${hotel.id}`)
      ])
      setAnalytics(a.data)
      setBookings(b.data.bookings || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t) }, [hotel.id])

  const stat = (label, value, sub, color) => (
    <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 16, padding: 22, flex: 1, minWidth: 180 }}>
      <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ color, fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{value}</div>
      <div style={{ color: '#475569', fontSize: 13 }}>{sub}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <div style={{ background: 'rgba(30,41,59,0.9)', borderBottom: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>S1</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>{hotel.name}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {hotel.mmt_hotel_code && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 6px', borderRadius: 4 }}>MMT: {hotel.mmt_hotel_code}</span>}
                {hotel.goibibo_hotel_code && <span style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', padding: '2px 6px', borderRadius: 4 }}>GOI: {hotel.goibibo_hotel_code}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Sync Banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: '18px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#10b981', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🔗 Channel Manager Active</div>
            <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
              Your inventory is actively synced. Bookings on connected OTAs will automatically block availability everywhere.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
              <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>MakeMyTrip Code</div>
              <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: 14 }}>{hotel.mmt_hotel_code || 'Not Linked'}</div>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(249,115,22,0.2)', textAlign: 'center' }}>
              <div style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>Goibibo Code</div>
              <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: 14 }}>{hotel.goibibo_hotel_code || 'Not Linked'}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {analytics && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            {stat('Occupancy', `${analytics.occupancy_percentage}%`, `${analytics.occupied}/${analytics.total_rooms} rooms`, '#10b981')}
            {stat('Total Revenue', `₹${(analytics.total_revenue || 0).toLocaleString()}`, 'All confirmed bookings', '#60a5fa')}
            {stat('Today\'s Bookings', analytics.bookings_today, `${analytics.total_bookings} total`, '#a78bfa')}
            {stat('Available Rooms', analytics.available, 'Ready to book', '#f59e0b')}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(30,41,59,0.5)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {['overview', 'rooms', 'sync'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: tab === t ? '#10b981' : 'transparent', color: tab === t ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
              {t === 'sync' ? '🔗 Sync Log' : t === 'rooms' ? '🛏️ Rooms' : '📊 Bookings'}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
        {tab === 'rooms' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {(!analytics?.rooms || analytics.rooms.length === 0) ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569', gridColumn: '1 / -1', background: 'rgba(30,41,59,0.8)', borderRadius: 20 }}>
                No rooms available.
              </div>
            ) : (
              analytics.rooms.map(room => (
                <div key={room.id} style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{room.room_number}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, textTransform: 'capitalize', fontWeight: 600 }}>{room.category} • ₹{room.rate_per_night}</div>
                    </div>
                    <div style={{ 
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                      background: room.status === 'available' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: room.status === 'available' ? '#34d399' : '#f87171'
                    }}>
                      {room.status}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    {room.status === 'occupied' && room.current_booking ? (
                      <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(15,23,42,0.4))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Current Guest</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{room.current_booking.guest_name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 13 }}>Out: {room.current_booking.check_out}</div>
                      </div>
                    ) : room.next_booking ? (
                      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Next Booking</div>
                        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{room.next_booking.guest_name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 13 }}>In: {room.next_booking.check_in}</div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 12, padding: 16, color: '#64748b', fontSize: 13, textAlign: 'center', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 90 }}>
                        No upcoming bookings
                      </div>
                    )}
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 16, marginTop: 'auto', display: 'flex', gap: 12, color: '#64748b', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>👤 Max {room.max_guests}</div>
                    {room.facilities && <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>✨ {room.facilities}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bookings Table */}
        {tab === 'overview' && (
          <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>Recent Bookings</h3>
              <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>⟳ Live</span>
            </div>
            {bookings.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No bookings yet. Share your sync key to start receiving bookings!</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15,23,42,0.4)' }}>
                      {['Guest','Room','Check-in','Check-out','Source','Amount'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(148,163,184,0.04)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 20px', color: '#e2e8f0', fontWeight: 600 }}>{b.guest_name}</td>
                        <td style={{ padding: '14px 20px', color: '#94a3b8' }}>
                          {b.rooms?.room_number} <span style={{ fontSize: 12, color: '#475569', textTransform: 'capitalize' }}>({b.rooms?.category})</span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 14 }}>{b.check_in}</td>
                        <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 14 }}>{b.check_out}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                            background: b.source === 'makemytrip' ? 'rgba(239,68,68,0.15)' : b.source === 'goibibo' ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)',
                            color: b.source === 'makemytrip' ? '#f87171' : b.source === 'goibibo' ? '#fb923c' : '#34d399'
                          }}>{b.source}</span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#fff', fontWeight: 800 }}>₹{b.total_amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sync Log */}
        {tab === 'sync' && (
          <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>🔗 Cross-Platform Sync Log</h3>
              <p style={{ color: '#475569', margin: '4px 0 0', fontSize: 14 }}>Every time StayOne blocked a room on another platform to prevent a double booking.</p>
            </div>
            {(!analytics?.sync_log || analytics.sync_log.length === 0) ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No sync activity yet. Make a booking on MakeMyTrip or Goibibo to see the magic happen.</div>
            ) : (
              analytics.sync_log.map(log => (
                <div key={log.id} style={{ padding: '16px 24px', borderTop: '1px solid rgba(148,163,184,0.06)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(16,185,129,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔗</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>Room {log.room_number} blocked</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                      Booked on <span style={{ color: '#fb923c', fontWeight: 600 }}>{log.source_platform}</span>
                      {' → '}
                      Blocked on <span style={{ color: '#60a5fa', fontWeight: 600 }}>{log.target_platform}</span>
                    </div>
                  </div>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>✓ Synced</div>
                  <div style={{ color: '#475569', fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
