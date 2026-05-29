import os
import json
import re
import secrets
import httpx
from datetime import date, datetime, timezone, timedelta
from typing import Optional

from groq import Groq
from fastapi import FastAPI, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from dotenv import load_dotenv
from supabase import create_client, Client
from twilio.twiml.messaging_response import MessagingResponse

load_dotenv()

SUPABASE_URL       = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY       = os.getenv("SUPABASE_KEY", "")
GROQ_API_KEY       = os.getenv("GROQ_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

supabase: Optional[Client] = None
groq_client = None

try:
    if SUPABASE_URL.startswith("http") and len(SUPABASE_KEY) > 10:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[OK]  Supabase connected")
    else:
        print("[WARN] Supabase not configured")
except Exception as e:
    print(f"[WARN] Supabase init failed: {e}")

try:
    if GROQ_API_KEY and not GROQ_API_KEY.startswith("your_"):
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("[OK]  Groq client ready")
    else:
        print("[WARN] Groq API key not configured")
except Exception as e:
    print(f"[WARN] Groq init failed: {e}")

IST = timezone(timedelta(hours=5, minutes=30))
def today_ist() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")

app = FastAPI(title="StayOne Sync API", version="7.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ──────────────────────────────────────────────────────

def _require_sb():
    if not supabase:
        from fastapi import HTTPException
        raise HTTPException(503, "Database not configured")

def dates_overlap(a_in, a_out, b_in, b_out) -> bool:
    try:
        ai, ao = date.fromisoformat(str(a_in)[:10]), date.fromisoformat(str(a_out)[:10])
        bi, bo = date.fromisoformat(str(b_in)[:10]), date.fromisoformat(str(b_out)[:10])
        return ai < bo and ao > bi
    except Exception as e:
        print(f"[WARN] dates_overlap error: {e}")
        return True

def is_stayone_room_free(room_id: str, check_in: str, check_out: str) -> bool:
    try:
        q = supabase.table("bookings").select("check_in,check_out").eq("room_id", room_id).eq("status", "confirmed")
        for b in (q.execute().data or []):
            if dates_overlap(check_in, check_out, b["check_in"], b["check_out"]):
                return False
        return True
    except:
        return False

def is_ota_room_free(ota_room_id: str, check_in: str, check_out: str) -> bool:
    try:
        q = supabase.table("ota_bookings").select("check_in,check_out").eq("ota_room_id", ota_room_id)
        for b in (q.execute().data or []):
            if dates_overlap(check_in, check_out, b["check_in"], b["check_out"]):
                return False
        return True
    except:
        return False

def get_stayone_hotel_by_ota_code(hotel_code: str, platform: str):
    """Find if StayOne has a mapped hotel for this OTA code."""
    try:
        col = "mmt_hotel_code" if platform == "makemytrip" else "goibibo_hotel_code"
        res = supabase.table("hotels").select("*").eq(col, hotel_code).execute()
        return res.data[0] if res.data else None
    except:
        return None

def log_sync(booking_id, hotel_id, source, target, room_number):
    try:
        supabase.table("booking_sync_log").insert({
            "booking_id": booking_id,
            "hotel_id": hotel_id,
            "source_platform": source,
            "target_platform": target,
            "room_number": room_number,
            "action": "block",
            "status": "success"
        }).execute()
    except Exception as e:
        print(f"[WARN] Sync log failed: {e}")


# ============================================================
# STAYONE DASHBOARD API
# ============================================================

@app.get("/api/dev/clear")
async def clear_bookings():
    _require_sb()
    try:
        supabase.table("booking_sync_log").delete().neq("status", "non-existent").execute()
        supabase.table("ota_bookings").delete().neq("guest_name", "non-existent").execute()
        supabase.table("bookings").delete().neq("status", "non-existent").execute()
        return {"success": True, "message": "All bookings have been successfully cleared!"}
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(500, {"error": str(e)})


@app.post("/api/hotels/register")
async def register_hotel(request: Request):
    """Hotel manager registers their hotel on StayOne and inputs OTA codes."""
    _require_sb()
    try:
        body = await request.json()
        name        = body.get("name", "").strip()
        city        = body.get("city", "").strip()
        location    = body.get("location", "").strip()
        owner_email = body.get("owner_email", "").strip()
        password    = body.get("password", "").strip()
        owner_phone = body.get("owner_phone", "")
        mmt_code    = body.get("mmt_hotel_code", "").strip() or None
        goi_code    = body.get("goibibo_hotel_code", "").strip() or None

        if not all([name, city, owner_email, password]):
            return JSONResponse(400, {"error": "name, city, owner_email, password are required"})

        # Check if email is in the admin-approved whitelist
        allowed = supabase.table("allowed_emails").select("email").eq("email", owner_email).execute()
        if not allowed.data:
            return JSONResponse(403, {"error": "Email not authorized. Please contact StayOne admin."})

        existing = supabase.table("hotels").select("id").eq("owner_email", owner_email).execute()
        if existing.data:
            return JSONResponse(409, {"error": "Email already registered"})

        hotel = supabase.table("hotels").insert({
            "name": name,
            "city": city,
            "location": location or city,
            "owner_email": owner_email,
            "password": password,
            "owner_phone": owner_phone,
            "mmt_hotel_code": mmt_code,
            "goibibo_hotel_code": goi_code,
        }).execute()
        
        hotel_id = hotel.data[0]["id"]
        
        # Auto-Import Rooms Feature
        # If OTA codes were provided, we auto-import the rooms to StayOne master inventory
        imported_rooms = False
        target_ota_code = mmt_code or goi_code # Prefer MMT, fallback to Goibibo
        
        if target_ota_code:
            ota_hotel = supabase.table("ota_hotels").select("id").eq("hotel_code", target_ota_code).execute().data
            if ota_hotel:
                ota_rooms = supabase.table("ota_rooms").select("*").eq("ota_hotel_id", ota_hotel[0]["id"]).execute().data
                for r in (ota_rooms or []):
                    # Check if room already exists to prevent duplicates (though it shouldn't on fresh register)
                    existing_room = supabase.table("rooms").select("id").eq("hotel_id", hotel_id).eq("room_number", r["room_number"]).execute().data
                    if not existing_room:
                        supabase.table("rooms").insert({
                            "hotel_id": hotel_id,
                            "room_number": r["room_number"],
                            "category": r["category"],
                            "rate_per_night": r["rate"],
                            "facilities": r["facilities"],
                            "max_guests": r["max_guests"]
                        }).execute()
                        imported_rooms = True

        msg = "Hotel registered and synced!"
        if imported_rooms:
            msg += " Rooms automatically imported from OTA."

        return JSONResponse(content={
            "success": True,
            "hotel": hotel.data[0],
            "message": msg
        })
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.post("/api/hotels/login")
async def hotel_login(request: Request):
    _require_sb()
    try:
        body = await request.json()
        email    = body.get("email", "").strip()
        password = body.get("password", "").strip()
        res = supabase.table("hotels").select("*").eq("owner_email", email).execute()
        if not res.data:
            return JSONResponse(401, {"error": "Hotel not found"})
        hotel = res.data[0]
        if hotel.get("password") != password:
            return JSONResponse(401, {"error": "Invalid password"})
        return JSONResponse(content={"hotel": hotel})
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.post("/api/hotels/{hotel_id}/rooms")
async def add_room(hotel_id: str, request: Request):
    _require_sb()
    try:
        body = await request.json()
        room = supabase.table("rooms").insert({
            "hotel_id": hotel_id,
            "room_number": body.get("room_number"),
            "category": body.get("category"),
            "rate_per_night": body.get("rate_per_night"),
            "facilities": body.get("facilities", ""),
            "max_guests": body.get("max_guests", 2),
        }).execute()
        return JSONResponse(content={"room": room.data[0]})
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.get("/api/bookings/{hotel_id}")
async def get_bookings(hotel_id: str):
    _require_sb()
    try:
        res = supabase.table("bookings").select("*, rooms(room_number, category, rate_per_night)").eq("hotel_id", hotel_id).order("created_at", desc=True).execute()
        return JSONResponse(content={"bookings": res.data or []})
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.get("/api/analytics/{hotel_id}")
async def get_analytics(hotel_id: str):
    _require_sb()
    try:
        rooms    = supabase.table("rooms").select("*").eq("hotel_id", hotel_id).order("room_number").execute().data or []
        bookings = supabase.table("bookings").select("*").eq("hotel_id", hotel_id).eq("status", "confirmed").execute().data or []
        today    = today_ist()

        occupied = 0
        rooms_status = []

        for room in rooms:
            # Find current booking for this room
            current_booking = next((b for b in bookings if b["room_id"] == room["id"] and b["check_in"] <= today < b["check_out"]), None)
            
            # Find future bookings
            future_bookings = sorted([b for b in bookings if b["room_id"] == room["id"] and b["check_in"] > today], key=lambda x: x["check_in"])
            next_booking = future_bookings[0] if future_bookings else None

            if current_booking:
                occupied += 1
            
            rooms_status.append({
                "id": room["id"],
                "room_number": room["room_number"],
                "category": room["category"],
                "rate_per_night": room["rate_per_night"],
                "facilities": room.get("facilities", ""),
                "max_guests": room.get("max_guests", 2),
                "status": "occupied" if current_booking else "available",
                "current_booking": current_booking,
                "next_booking": next_booking
            })

        total_rooms = len(rooms)
        revenue = sum(b.get("total_amount", 0) or 0 for b in bookings)
        bookings_today = sum(1 for b in bookings if b.get("created_at", "").startswith(today))
        by_source = {}
        for b in bookings:
            src = b.get("source", "unknown")
            by_source[src] = by_source.get(src, 0) + 1

        sync_log = supabase.table("booking_sync_log").select("*").eq("hotel_id", hotel_id).order("created_at", desc=True).limit(20).execute().data or []

        return JSONResponse(content={
            "total_rooms": total_rooms,
            "occupied": occupied,
            "available": total_rooms - occupied,
            "occupancy_percentage": round((occupied / total_rooms) * 100, 1) if total_rooms else 0,
            "total_bookings": len(bookings),
            "bookings_today": bookings_today,
            "total_revenue": revenue,
            "by_source": by_source,
            "sync_log": sync_log,
            "rooms": rooms_status,
        })
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})


# ============================================================
# OTA API
# ============================================================

@app.get("/api/ota/hotels")
async def ota_list_hotels(platform: str, city: str = None):
    _require_sb()
    try:
        q = supabase.table("ota_hotels").select("*, ota_rooms(*)").eq("platform", platform)
        if city:
            q = q.ilike("city", f"%{city}%")
        res = q.execute()
        return JSONResponse(content={"hotels": res.data or []})
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.post("/api/ota/hotels/register")
async def ota_register_hotel(request: Request):
    """Hotel manager lists their hotel on an OTA, getting an OTA Hotel Code."""
    _require_sb()
    try:
        body = await request.json()
        platform     = body.get("platform") 
        name         = body.get("name", "").strip()
        city         = body.get("city", "").strip()
        location     = body.get("location", "").strip()
        description  = body.get("description", "")
        rating       = body.get("rating", 4.0)
        amenities    = body.get("amenities", [])
        image_url    = body.get("image_url", "")
        rooms        = body.get("rooms", [])

        prefix = "MMT" if platform == "makemytrip" else "GOI"
        hotel_code = f"{prefix}-{secrets.token_hex(3).upper()}"

        hotel = supabase.table("ota_hotels").insert({
            "hotel_code": hotel_code,
            "platform": platform,
            "name": name,
            "city": city,
            "location": location,
            "description": description,
            "rating": rating,
            "amenities": amenities,
            "image_url": image_url,
        }).execute()
        
        ota_hotel_id = hotel.data[0]["id"]

        # Insert user-provided rooms
        if rooms:
            for r in rooms:
                supabase.table("ota_rooms").insert({
                    "ota_hotel_id": ota_hotel_id,
                    "room_number": r.get("room_number", "101"),
                    "category": r.get("category", "deluxe"),
                    "rate": r.get("rate", 5000),
                    "facilities": r.get("facilities", "AC, WiFi"),
                    "max_guests": r.get("max_guests", 2)
                }).execute()
        else:
            # Fallback if no rooms provided
            supabase.table("ota_rooms").insert({
                "ota_hotel_id": ota_hotel_id,
                "room_number": "101",
                "category": "deluxe",
                "rate": 5000,
                "facilities": "AC, WiFi",
                "max_guests": 2
            }).execute()

        return JSONResponse(content={
            "success": True, 
            "hotel": hotel.data[0],
            "hotel_code": hotel_code
        })
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.post("/api/ota/hotels/{ota_hotel_id}/rooms")
async def ota_add_room(ota_hotel_id: str, request: Request):
    _require_sb()
    try:
        body = await request.json()
        room = supabase.table("ota_rooms").insert({
            "ota_hotel_id": ota_hotel_id,
            "room_number": body.get("room_number"),
            "category": body.get("category"),
            "rate": body.get("rate"),
            "facilities": body.get("facilities", ""),
            "max_guests": body.get("max_guests", 2),
        }).execute()
        return JSONResponse(content={"room": room.data[0]})
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.get("/api/ota/availability")
async def ota_availability(ota_hotel_id: str, check_in: str, check_out: str, platform: str):
    _require_sb()
    try:
        hotel_res = supabase.table("ota_hotels").select("*").eq("id", ota_hotel_id).execute()
        if not hotel_res.data:
            return JSONResponse(status_code=404, content={"error": "Hotel not found"})
        ota_hotel = hotel_res.data[0]

        ota_rooms = supabase.table("ota_rooms").select("*").eq("ota_hotel_id", ota_hotel_id).execute().data or []

        stayone_hotel = get_stayone_hotel_by_ota_code(ota_hotel["hotel_code"], platform)

        result_rooms = []
        for ota_room in ota_rooms:
            available = True

            if stayone_hotel:
                # Check StayOne master
                stayone_rooms = supabase.table("rooms").select("*").eq("hotel_id", stayone_hotel["id"]).eq("room_number", ota_room["room_number"]).execute().data
                if stayone_rooms:
                    available = is_stayone_room_free(stayone_rooms[0]["id"], check_in, check_out)
                else:
                    available = is_ota_room_free(ota_room["id"], check_in, check_out)
            else:
                available = is_ota_room_free(ota_room["id"], check_in, check_out)

            result_rooms.append({**ota_room, "available": available, "synced": stayone_hotel is not None})

        return JSONResponse(content={
            "rooms": result_rooms,
            "hotel": ota_hotel,
            "synced_with_stayone": stayone_hotel is not None,
        })
    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.post("/api/ota/book")
async def ota_book(request: Request):
    _require_sb()
    try:
        body = await request.json()
        ota_room_id  = body.get("ota_room_id")
        ota_hotel_id = body.get("ota_hotel_id")
        guest_name   = body.get("guest_name", "").strip()
        guest_phone  = body.get("guest_phone", "")
        check_in     = body.get("check_in")
        check_out    = body.get("check_out")
        platform     = body.get("platform")
        guests       = int(body.get("number_of_people", 1))

        ota_hotel = supabase.table("ota_hotels").select("*").eq("id", ota_hotel_id).execute().data[0]
        ota_room = supabase.table("ota_rooms").select("*").eq("id", ota_room_id).execute().data[0]

        max_guests = ota_room.get("max_guests", 2)
        if guests > max_guests:
            return JSONResponse(status_code=400, content={"error": f"Number of people ({guests}) exceeds room capacity ({max_guests}). Booking cancelled."})

        nights = (date.fromisoformat(str(check_out)[:10]) - date.fromisoformat(str(check_in)[:10])).days
        if nights <= 0:
            nights = 1
        
        total = int(nights * ota_room["rate"])

        stayone_hotel = get_stayone_hotel_by_ota_code(ota_hotel["hotel_code"], platform)

        if stayone_hotel:
            # SYNCED PATH
            stayone_rooms = supabase.table("rooms").select("*").eq("hotel_id", stayone_hotel["id"]).eq("room_number", ota_room["room_number"]).execute().data
            if not stayone_rooms:
                return JSONResponse(status_code=404, content={"error": "Room not mapped in StayOne system."})

            stayone_room = stayone_rooms[0]

            if not is_stayone_room_free(stayone_room["id"], check_in, check_out):
                return JSONResponse(status_code=409, content={"error": "Room already booked for this period (synced)."})

            booking = supabase.table("bookings").insert({
                "hotel_id": stayone_hotel["id"],
                "room_id": stayone_room["id"],
                "guest_name": guest_name,
                "guest_phone": guest_phone,
                "check_in": check_in,
                "check_out": check_out,
                "total_amount": total,
                "status": "confirmed",
                "source": platform,
            }).execute()

            booking_data = booking.data[0]

            other_platform = "goibibo" if platform == "makemytrip" else "makemytrip"
            log_sync(booking_data["id"], stayone_hotel["id"], platform, other_platform, ota_room["room_number"])

            return JSONResponse(content={
                "success": True, "synced": True,
                "booking": {
                    "guest_name": guest_name, "room_number": ota_room["room_number"],
                    "category": ota_room["category"], "check_in": check_in,
                    "check_out": check_out, "total_amount": total,
                },
                "message": f"Booking confirmed via StayOne! Room {ota_room['room_number']} is now blocked on other platforms."
            })

        else:
            # UNSYNCED PATH
            if not is_ota_room_free(ota_room_id, check_in, check_out):
                return JSONResponse(status_code=409, content={"error": "Room already booked for this period."})

            supabase.table("ota_bookings").insert({
                "ota_room_id": ota_room_id,
                "guest_name": guest_name,
                "check_in": check_in,
                "check_out": check_out,
            }).execute()

            return JSONResponse(content={
                "success": True, "synced": False,
                "booking": {
                    "guest_name": guest_name, "room_number": ota_room["room_number"],
                    "category": ota_room["category"], "check_in": check_in,
                    "check_out": check_out, "total_amount": total,
                },
                "message": f"Booking confirmed on {platform}!"
            })

    except Exception as e:
        return JSONResponse(500, {"error": str(e)})

@app.get("/health")
async def health():
    return {"status": "ok", "service": "StayOne API v7"}
