import React, { useEffect, useState, useCallback, useRef } from 'react'
import { subscribeToBookings, subscribeToRooms, subscribeToNotifications } from '../services/firebase.js'
import StatsRow from './StatsRow.jsx'
import RoomGrid from './RoomGrid.jsx'
import BookingFeed from './BookingFeed.jsx'
import NotificationPanel from './NotificationPanel.jsx'
import ManualBookingForm from './ManualBookingForm.jsx'
import OTASimulator from './OTASimulator.jsx'
import { Bell, MessageCircle, Zap } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

const STATIC_ROOMS = [
  { id: 'room_101', room_number: '101', type: 'Standard Double', price_per_night: 1499, status: 'available', photo_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', amenities: ['AC', 'TV', 'WiFi'] },
  { id: 'room_102', room_number: '102', type: 'Standard Double', price_per_night: 1499, status: 'available', photo_url: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800', amenities: ['AC', 'TV', 'WiFi'] },
  { id: 'room_103', room_number: '103', type: 'Deluxe Double', price_per_night: 2499, status: 'available', photo_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', amenities: ['AC', 'TV', 'WiFi', 'Mini Bar', 'City View'] },
  { id: 'room_104', room_number: '104', type: 'Deluxe Double', price_per_night: 2499, status: 'available', photo_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', amenities: ['AC', 'TV', 'WiFi', 'Mini Bar', 'City View'] },
  { id: 'room_105', room_number: '105', type: 'Executive Suite', price_per_night: 4999, status: 'available', photo_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', amenities: ['AC', 'TV', 'WiFi', 'Mini Bar', 'City View', 'Jacuzzi', 'King Bed'] },
]

export default function Dashboard() {
  const [rooms, setRooms] = useState(STATIC_ROOMS)
  const [bookings, setBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [conflictRoomId, setConflictRoomId] = useState(null)
  const [conflictBanner, setConflictBanner] = useState(null)
  const bannerTimerRef = useRef(null)

  // ── Firebase real-time listeners ───────────────────────────────────────────
  useEffect(() => {
    const unsub1 = subscribeToRooms((liveRooms) => {
      if (liveRooms.length > 0) {
        // Build a lookup map from room_number → status
        const statusMap = {}
        liveRooms.forEach((r) => {
          const num = r.room_number || r.roomNumber
          if (num) statusMap[num] = r.status
        })
        setRooms((prev) =>
          prev.map((r) => ({
            ...r,
            status: statusMap[r.room_number] ?? r.status,
          }))
        )
      }
    })

    const unsub2 = subscribeToBookings((data) => {
      setBookings(data)
    })

    const unsub3 = subscribeToNotifications((data) => {
      setNotifications(data)
    })

    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  const triggerConflictAnimation = useCallback((roomId, platform, roomNumber) => {
    setConflictRoomId(roomId)
    setTimeout(() => setConflictRoomId(null), 1800)
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    setConflictBanner({ platform, roomNumber })
    bannerTimerRef.current = setTimeout(() => setConflictBanner(null), 5000)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const stats = {
    todayBookings: bookings.filter((b) => {
      const today = new Date().toISOString().split('T')[0]
      return b.check_in === today && b.status === 'confirmed'
    }).length,
    confirmedCount: bookings.filter((b) => b.status === 'confirmed').length,
    totalRooms: rooms.length,
    bookedRooms: rooms.filter((r) => r.status === 'booked' || r.status === 'blocked').length,
    revenueToday: bookings
      .filter((b) => {
        const today = new Date().toISOString().split('T')[0]
        return b.check_in === today && b.status === 'confirmed'
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Conflict Banner */}
      {conflictBanner && (
        <div className="conflict-banner fixed top-0 left-0 right-0 z-50 bg-red-600 border-b-2 border-red-400 px-6 py-3 flex items-center justify-between shadow-2xl shadow-red-900/50">
          <div className="flex items-center gap-3 text-white">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-lg">Booking Conflict Blocked</p>
              <p className="text-red-100 text-sm">
                {conflictBanner.platform} attempted to book Room {conflictBanner.roomNumber} — Automatically Rejected
              </p>
            </div>
          </div>
          <button onClick={() => setConflictBanner(null)} className="text-red-200 hover:text-white text-2xl font-bold leading-none ml-4">×</button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700/60 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-indigo-400 tracking-tight">StayOne</span>
          </div>

          <div className="text-center hidden sm:block">
            <h1 className="text-base font-bold text-slate-200 tracking-wide">Hotel Grand Kolkata Inn</h1>
            <p className="text-xs text-slate-500">14 Park Street, Kolkata 700016</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-[pulseDot_2s_ease-in-out_infinite]" />
              <span className="text-xs font-semibold text-emerald-400">Live</span>
            </div>
            <button className="relative p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <Bell className="w-6 h-6 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>


      {/* Main */}
      <main className="flex-1 px-4 md:px-6 py-6 max-w-[1600px] mx-auto w-full">
        <StatsRow stats={stats} />
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 flex flex-col gap-6">
            <RoomGrid rooms={rooms} conflictRoomId={conflictRoomId} />
            <BookingFeed bookings={bookings} />
          </div>
          <div className="xl:col-span-2 flex flex-col gap-6">
            <NotificationPanel notifications={notifications} />
            <ManualBookingForm rooms={rooms} apiBase={API_BASE} />
            <OTASimulator rooms={rooms} apiBase={API_BASE} onConflict={triggerConflictAnimation} />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <p className="text-slate-500 text-sm font-medium">
            StayOne — <span className="text-indigo-400">Powered by Agentic AI</span>
          </p>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Bot Active</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-[pulseDot_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </footer>
    </div>
  )
}
