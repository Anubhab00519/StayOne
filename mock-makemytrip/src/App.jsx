import { useState } from 'react'
import axios from 'axios'
import { format, addDays } from 'date-fns'

const API = 'http://localhost:8000/api'
const PLATFORM = 'makemytrip'

const CITY_IMAGES = {
  Mumbai: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400',
  Goa: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  Delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400',
  Kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400',
  Shimla: 'https://images.unsplash.com/photo-1605538032404-d7ac3b64329e?w=400',
  Jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed31d3e?w=400',
}

export default function App() {
  const [page, setPage] = useState('home') // home | results | hotel | register | confirmation
  const [city, setCity] = useState('')
  const [checkIn, setCheckIn] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'))
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [hotelRooms, setHotelRooms] = useState([])
  const [booking, setBooking] = useState(null)
  const [bookingErrorMsg, setBookingErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!city.trim()) return
    setLoading(true)
    try {
      const res = await axios.get(`${API}/ota/hotels`, { params: { platform: PLATFORM, city } })
      setHotels(res.data.hotels || [])
      setPage('results')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const selectHotel = async (hotel) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/ota/availability`, {
        params: { ota_hotel_id: hotel.id, check_in: checkIn, check_out: checkOut, platform: PLATFORM }
      })
      setSelectedHotel(res.data.hotel)
      setHotelRooms(res.data.rooms || [])
      setPage('hotel')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setPage('home')}>
            <div style={{ background: 'linear-gradient(135deg,#e53e3e,#dd6b20)', borderRadius: 10, padding: '6px 12px', color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: -1 }}>mmt</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#1a202c' }}>MakeMyTrip</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => setPage('register')} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              🏨 List Your Hotel
            </button>
          </div>
        </div>
      </div>

      {/* Home */}
      {page === 'home' && (
        <div>
          <div style={{ background: 'linear-gradient(135deg,#e53e3e 0%,#dd6b20 100%)', padding: '60px 24px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
              <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 900, margin: '0 0 8px' }}>Find Your Perfect Stay</h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, margin: '0 0 36px' }}>10M+ hotels across India</p>
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, display: 'flex', gap: 12, flexWrap: 'wrap', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <input value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="🌆 City (Mumbai, Goa, Delhi...)"
                  style={{ flex: 2, padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', minWidth: 200 }} />
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', minWidth: 150 }} />
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', minWidth: 150 }} />
                <button onClick={search} disabled={loading}
                  style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                  {loading ? '...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px' }}>
            <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 20 }}>Popular Cities</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {Object.entries(CITY_IMAGES).map(([c, img]) => (
                <div key={c} onClick={() => { setCity(c); search() }} style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 160 }}>
                  <img src={img} alt={c} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.7))', padding: '20px 16px 12px' }}>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{c}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {page === 'results' && (
        <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={() => setPage('home')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
            <h2 style={{ fontWeight: 800, fontSize: 22 }}>{hotels.length} hotels in {city}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
            {hotels.map(h => (
              <div key={h.id} onClick={() => selectHotel(h)} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s', border: '1px solid #f0f0f0' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <img src={h.image_url || 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'} alt={h.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{h.name}</h3>
                    <span style={{ background: '#276749', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: 13 }}>★ {h.rating}</span>
                  </div>
                  <p style={{ color: '#666', fontSize: 13, margin: '6px 0 10px' }}>📍 {h.location}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(h.amenities || []).slice(0,3).map(a => (
                      <span key={a} style={{ background: '#f3f4f6', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#555' }}>{a}</span>
                    ))}
                  </div>
                  {h.stayone_sync_key && (
                    <div style={{ marginTop: 10, background: '#f0fff4', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#276749', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🔗</span> StayOne Sync Active
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotel Detail */}
      {page === 'hotel' && selectedHotel && (
        <HotelDetail hotel={selectedHotel} rooms={hotelRooms} checkIn={checkIn} checkOut={checkOut}
          onBack={() => setPage('results')} platform={PLATFORM}
          onBooked={b => { setBooking(b); setPage('confirmation') }} 
          onBookFailed={err => { setBookingErrorMsg(err); setPage('failure') }} />
      )}

      {/* Registration */}
      {page === 'register' && (
        <HotelRegister platform={PLATFORM} onBack={() => setPage('home')} />
      )}

      {/* Confirmation */}
      {page === 'confirmation' && booking && (
        <Confirmation booking={booking} onHome={() => { setBooking(null); setPage('home') }} platform={PLATFORM} />
      )}

      {/* Failure */}
      {page === 'failure' && (
        <Failure message={bookingErrorMsg} onBack={() => setPage('hotel')} platform={PLATFORM} />
      )}
    </div>
  )
}

function HotelDetail({ hotel, rooms, checkIn, checkOut, onBack, platform, onBooked, onBookFailed }) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [bookingCheckIn, setBookingCheckIn] = useState(checkIn.includes('T') ? checkIn : `${checkIn}T14:00`)
  const [bookingCheckOut, setBookingCheckOut] = useState(checkOut.includes('T') ? checkOut : `${checkOut}T11:00`)
  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const book = async (room) => {
    if (!guestName.trim() || !guestPhone.trim()) { setError('Please fill in your name and phone.'); return }
    setLoading(true); setError('')
    try {
      const res = await axios.post(`http://localhost:8000/api/ota/book`, {
        ota_hotel_id: hotel.id, ota_room_id: room.id,
        guest_name: guestName, guest_phone: guestPhone,
        check_in: bookingCheckIn, check_out: bookingCheckOut,
        number_of_people: numberOfPeople, platform
      })
      onBooked(res.data)
    } catch (e) {
      if (onBookFailed) onBookFailed(e.response?.data?.error || 'Booking failed')
      else setError(e.response?.data?.error || 'Booking failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', marginBottom: 20, fontWeight: 600 }}>← All Hotels</button>
      <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <img src={hotel.image_url || 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'} alt={hotel.name} style={{ width: '100%', height: 300, objectFit: 'cover' }} />
        <div style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 28, margin: '0 0 6px' }}>{hotel.name}</h1>
              <p style={{ color: '#666', margin: 0 }}>📍 {hotel.location} · {hotel.city}</p>
            </div>
            <span style={{ background: '#276749', color: '#fff', borderRadius: 10, padding: '6px 14px', fontWeight: 800, fontSize: 20 }}>★ {hotel.rating}</span>
          </div>
          <p style={{ color: '#555', marginTop: 12, lineHeight: 1.6 }}>{hotel.description}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {(hotel.amenities || []).map(a => (
              <span key={a} style={{ background: '#f3f4f6', borderRadius: 8, padding: '4px 12px', fontSize: 13 }}>{a}</span>
            ))}
          </div>
          {hotel.stayone_sync_key && (
            <div style={{ marginTop: 16, background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 10, padding: '10px 16px', color: '#276749', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 StayOne Sync Active — Bookings synced across MakeMyTrip & Goibibo
            </div>
          )}
        </div>
      </div>

      {/* Guest Details */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>Guest Details</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <input placeholder="Full Name" value={guestName} onChange={e => setGuestName(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', minWidth: 200 }} />
          <input placeholder="Phone Number" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', minWidth: 200 }} />
          <input type="number" min="1" placeholder="Number of People" value={numberOfPeople} onChange={e => setNumberOfPeople(parseInt(e.target.value) || 1)}
            style={{ flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', minWidth: 150 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
             <label style={{display:'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color:'#666'}}>Check-in Date & Time</label>
             <input type="datetime-local" value={bookingCheckIn} onChange={e => setBookingCheckIn(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
             <label style={{display:'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color:'#666'}}>Check-out Date & Time</label>
             <input type="datetime-local" value={bookingCheckOut} onChange={e => setBookingCheckOut(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        {error && <p style={{ color: '#e53e3e', fontWeight: 600, marginTop: 12 }}>{error}</p>}
      </div>

      {/* Rooms */}
      <h2 style={{ fontWeight: 800, marginBottom: 16 }}>Choose Your Room</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rooms.map(room => (
          <div key={room.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 17 }}>Room {room.room_number}</span>
                <span style={{ background: room.category === 'suite' ? '#fef3c7' : room.category === 'deluxe' ? '#e0f2fe' : '#f3f4f6', color: room.category === 'suite' ? '#92400e' : room.category === 'deluxe' ? '#0369a1' : '#374151', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{room.category}</span>
                {room.synced && <span style={{ background: '#f0fff4', color: '#276749', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>✓ Live Sync</span>}
              </div>
              <p style={{ color: '#666', margin: '6px 0 0', fontSize: 14 }}>{room.facilities} · 👤 Up to {room.max_guests || 2} Guests</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#e53e3e' }}>₹{room.rate?.toLocaleString()}<span style={{ fontWeight: 400, fontSize: 14, color: '#888' }}>/night</span></div>
              <button onClick={() => book(room)} disabled={loading}
                style={{ marginTop: 8, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                {loading ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HotelRegister({ platform, onBack }) {
  const [step, setStep] = useState(1) // 1: Details, 2: Rooms, 3: Success
  const [hotel, setHotel] = useState(null)
  const [form, setForm] = useState({ name: '', city: '', location: '', description: '', rating: '4.0', amenities: '', image_url: '' })
  const [rooms, setRooms] = useState([{ room_number: '101', category: 'deluxe', rate: 5000, facilities: 'AC, WiFi', max_guests: 2 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const proceedToRooms = (e) => {
    e.preventDefault()
    if (!form.name || !form.city) {
      setError('Name and City are required')
      return
    }
    setError('')
    setStep(2)
  }

  const addRoom = () => {
    setRooms([...rooms, { room_number: '', category: 'standard', rate: 3000, facilities: 'AC', max_guests: 2 }])
  }

  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms]
    newRooms[index][field] = value
    setRooms(newRooms)
  }

  const removeRoom = (index) => {
    if (rooms.length === 1) return;
    setRooms(rooms.filter((_, i) => i !== index))
  }

  const register = async () => {
    setLoading(true); setError('')
    try {
      const amenities = form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : []
      const payload = {
        platform, name: form.name, city: form.city, location: form.location,
        description: form.description, rating: parseFloat(form.rating),
        amenities, image_url: form.image_url, rooms: rooms
      }
      const res = await axios.post(`http://localhost:8000/api/ota/hotels/register`, payload)
      setHotel(res.data)
      setStep(3)
    } catch (e) { setError(e.response?.data?.error || 'Registration failed') }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', marginBottom: 24, fontWeight: 600 }}>← Back</button>
      <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontWeight: 900, fontSize: 26, margin: '0 0 6px' }}>List Your Hotel on MakeMyTrip</h2>
        {step === 1 && (
          <form onSubmit={proceedToRooms}>
            <p style={{ color: '#666', margin: '0 0 28px' }}>Fill in your hotel details to get started.</p>
            {[
              ['name','Hotel Name','e.g. Hotel Sunrise Palace'],
              ['city','City','e.g. Mumbai'],
              ['location','Location / Area','e.g. Andheri West'],
              ['description','Short Description','Brief description of your hotel'],
              ['rating','Star Rating','e.g. 4.2'],
              ['amenities','Amenities (comma separated)','WiFi, Pool, Spa, Gym'],
              ['image_url','Image URL (optional)','https://...'],
            ].map(([key, label, ph]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>{label}</label>
                <input placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {error && <p style={{ color: '#e53e3e', fontWeight: 600 }}>{error}</p>}
            <button type="submit"
              style={{ width: '100%', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>
              Proceed to Room Details →
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: '#555', margin: '0 0 24px' }}>Add the rooms available at your property.</p>
            
            <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
              {rooms.map((room, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, color: '#1e293b' }}>Room {i + 1}</div>
                    {rooms.length > 1 && <button onClick={() => removeRoom(i)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>Room Number</label>
                      <input value={room.room_number} onChange={e => updateRoom(i, 'room_number', e.target.value)} required placeholder="e.g. 101" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>Category</label>
                      <select value={room.category} onChange={e => updateRoom(i, 'category', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                        <option value="standard">Standard</option>
                        <option value="deluxe">Deluxe</option>
                        <option value="suite">Suite</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>Price per Night (₹)</label>
                      <input type="number" value={room.rate} onChange={e => updateRoom(i, 'rate', parseInt(e.target.value))} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>Max Guests</label>
                      <input type="number" value={room.max_guests} onChange={e => updateRoom(i, 'max_guests', parseInt(e.target.value))} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>Facilities</label>
                      <input value={room.facilities} onChange={e => updateRoom(i, 'facilities', e.target.value)} placeholder="AC, TV, WiFi, Minibar" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addRoom} style={{ background: 'none', border: '2px dashed #cbd5e1', color: '#666', borderRadius: 12, padding: '14px', width: '100%', fontWeight: 700, cursor: 'pointer', marginBottom: 24, marginTop: 8 }}>
              + Add Another Room
            </button>

            {error && <p style={{ color: '#e53e3e', fontWeight: 600 }}>{error}</p>}
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} disabled={loading} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: 'pointer' }}>Back</button>
              <button onClick={register} disabled={loading} style={{ flex: 2, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>
                {loading ? 'Listing...' : 'Finish & List Hotel'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && hotel && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontWeight: 900, fontSize: 24, color: '#276749' }}>Hotel Listed Successfully!</h3>
            <p style={{ color: '#555', margin: '12px 0 8px' }}><strong>{hotel.hotel.name}</strong> is now live on MakeMyTrip.</p>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, margin: '24px 0', textAlign: 'left' }}>
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>🔗 Your MakeMyTrip Hotel Code</div>
              <div style={{ background: '#fff', border: '2px dashed #cbd5e1', padding: '12px', borderRadius: 8, fontSize: 24, fontWeight: 900, color: '#e53e3e', textAlign: 'center', letterSpacing: 2, marginBottom: 12 }}>
                {hotel.hotel_code}
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Copy this code and paste it into your <strong>StayOne Channel Manager</strong> dashboard to automatically sync this listing with Goibibo and prevent double bookings.
              </p>
            </div>

            <button onClick={onBack} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>Go to Homepage</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Confirmation({ booking, onHome, platform }) {
  const b = booking.booking
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontWeight: 900, fontSize: 28, color: '#276749' }}>Booking Confirmed!</h2>
        <p style={{ color: '#666', marginBottom: 28 }}>{booking.message}</p>
        <div style={{ background: '#f8fafc', borderRadius: 16, padding: 24, textAlign: 'left', marginBottom: 24 }}>
          {[['Guest', b.guest_name], ['Room', `${b.room_number} (${b.category})`], ['Check-in', b.check_in], ['Check-out', b.check_out], ['Total', `₹${b.total_amount?.toLocaleString()}`]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#888' }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        {booking.synced && (
          <div style={{ background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 12, padding: 14, marginBottom: 20, color: '#276749', fontWeight: 700 }}>
            🔗 Room also blocked on Goibibo via StayOne Sync
          </div>
        )}
        <button onClick={onHome} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Back to Home</button>
      </div>
    </div>
  )
}

function Failure({ message, onBack, platform }) {
  const isMmt = platform === 'makemytrip'
  const isCapacityError = (message || '').toLowerCase().includes('capacity') || (message || '').toLowerCase().includes('guest')
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '2px solid #fee2e2' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontWeight: 900, fontSize: 28, color: '#dc2626' }}>Booking Failed</h2>
        <p style={{ color: '#444', fontSize: 18, marginBottom: 12, fontWeight: 700 }}>{message}</p>
        <p style={{ color: '#666', marginBottom: 28, lineHeight: 1.5 }}>
          {isCapacityError 
            ? "The number of guests exceeds the limit for this room. Please try again with fewer people or book multiple rooms."
            : "The room is booked for this period. Please book for any other time or choose other rooms."}
        </p>
        <button onClick={onBack} style={{ background: isMmt ? '#e53e3e' : '#ff6b00', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )
}
