import os
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from firebase_service import (
    seed_data,
    get_all_rooms,
    get_all_bookings,
    get_room,
    create_booking,
    create_notification,
    block_room,
)
from clash_detection import check_availability
from whatsapp_service import send_text_message, send_room_catalogue, send_booking_confirmation
from ai_agent import handle_guest_message

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="StayOne API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "stayone_verify_2024")

# Room type → room IDs mapping
ROOM_TYPE_MAP = {
    "standard": ["room_101", "room_102"],
    "deluxe":   ["room_103", "room_104"],
    "suite":    ["room_105"],
}


@app.on_event("startup")
def on_startup():
    try:
        seed_data()
    except Exception as e:
        print(f"[startup] Firebase seed failed (credentials may be missing): {e}")


# ── Request models ─────────────────────────────────────────────────────────────

class BookingCreateRequest(BaseModel):
    room_id: str
    guest_name: str
    guest_phone: str
    check_in: str   # YYYY-MM-DD
    check_out: str  # YYYY-MM-DD
    source: str     # walk_in | whatsapp | makemytrip | goibibo | booking_com
    hotel_id: Optional[str] = None


class OTASimulateRequest(BaseModel):
    platform: str   # makemytrip | goibibo | booking_com
    room_id: str
    guest_name: str
    guest_phone: str
    check_in: str
    check_out: str
    hotel_id: Optional[str] = None


class BlockRoomRequest(BaseModel):
    room_id: str
    reason: str
    start_date: str
    end_date: str
    hotel_id: Optional[str] = None


# ── Booking endpoints ─────────────────────────────────────────────────────────

@app.post("/bookings/create")
async def create_booking_endpoint(req: BookingCreateRequest):
    try:
        # Validate dates
        check_in_date  = date.fromisoformat(req.check_in)
        check_out_date = date.fromisoformat(req.check_out)
        if check_out_date <= check_in_date:
            raise HTTPException(status_code=400, detail="Check-out must be after check-in.")

        # Verify room exists
        room = get_room(req.room_id)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{req.room_id}' not found.")

        # Clash detection
        is_available, conflicting = check_availability(req.room_id, req.check_in, req.check_out)

        if not is_available:
            create_notification(
                message=(
                    f"Booking conflict: {req.source.title()} attempted to book "
                    f"Room {room['room_number']} — already confirmed (Booking #{conflicting.get('booking_id', '?')})."
                ),
                notif_type="conflict_detected",
                hotel_id=req.hotel_id,
            )
            return {
                "success": False,
                "conflict": True,
                "message": (
                    f"Room {room['room_number']} is not available for the selected dates. "
                    f"Conflict with existing booking #{conflicting.get('booking_id', '?')}."
                ),
                "conflicting_booking": conflicting,
                "room_number": room["room_number"],
            }

        # Calculate total
        nights = (check_out_date - check_in_date).days
        total  = nights * room["price_per_night"]

        # Create booking
        booking = create_booking(
            room_id=req.room_id,
            guest_name=req.guest_name,
            guest_phone=req.guest_phone,
            check_in=req.check_in,
            check_out=req.check_out,
            source=req.source,
            total_amount=total,
            hotel_id=req.hotel_id,
        )

        # Notification
        create_notification(
            message=f"New booking confirmed: {req.guest_name} → Room {room['room_number']} ({req.check_in} to {req.check_out}) via {req.source.replace('_', ' ').title()}.",
            notif_type="booking_confirmed",
            hotel_id=req.hotel_id,
        )

        # WhatsApp confirmation
        try:
            send_booking_confirmation(req.guest_phone, {
                "booking_id": booking["booking_id"],
                "room_type":  room["type"],
                "room_number": room["room_number"],
                "check_in":   req.check_in,
                "check_out":  req.check_out,
                "total_amount": total,
            })
        except Exception as e:
            print(f"[WhatsApp] Confirmation send failed: {e}")

        return {
            "success": True,
            "conflict": False,
            "booking": booking,
            "message": f"Booking confirmed for Room {room['room_number']}.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bookings/ota-simulate")
async def ota_simulate(req: OTASimulateRequest):
    try:
        check_in_date  = date.fromisoformat(req.check_in)
        check_out_date = date.fromisoformat(req.check_out)

        room = get_room(req.room_id)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{req.room_id}' not found.")

        is_available, conflicting = check_availability(req.room_id, req.check_in, req.check_out)

        platform_display = req.platform.replace("_", " ").title()

        if not is_available:
            # Create conflict notification
            create_notification(
                message=(
                    f"Booking conflict detected: {platform_display} attempted to book "
                    f"Room {room['room_number']} which is already confirmed. "
                    f"Booking automatically rejected."
                ),
                notif_type="conflict_detected",
                hotel_id=req.hotel_id,
            )

            # Create a rejected booking record for the feed
            nights = (check_out_date - check_in_date).days
            total  = nights * room["price_per_night"]
            create_booking(
                room_id=req.room_id,
                guest_name=req.guest_name,
                guest_phone=req.guest_phone,
                check_in=req.check_in,
                check_out=req.check_out,
                source=req.platform,
                total_amount=total,
                hotel_id=req.hotel_id,
                status="rejected",
                conflict_detected=True,
            )

            return {
                "success": False,
                "conflict": True,
                "platform": req.platform,
                "room_number": room["room_number"],
                "message": (
                    f"Booking conflict detected: {platform_display} attempted to book "
                    f"Room {room['room_number']} which is already confirmed. "
                    f"Booking automatically rejected."
                ),
                "conflicting_booking": conflicting,
            }

        # No conflict — create the booking
        nights = (check_out_date - check_in_date).days
        total  = nights * room["price_per_night"]

        booking = create_booking(
            room_id=req.room_id,
            guest_name=req.guest_name,
            guest_phone=req.guest_phone,
            check_in=req.check_in,
            check_out=req.check_out,
            source=req.platform,
            total_amount=total,
            hotel_id=req.hotel_id,
        )

        create_notification(
            message=f"OTA booking confirmed: {req.guest_name} → Room {room['room_number']} via {platform_display} ({req.check_in} to {req.check_out}).",
            notif_type="booking_confirmed",
            hotel_id=req.hotel_id,
        )

        return {
            "success": True,
            "conflict": False,
            "booking": booking,
            "message": f"OTA booking confirmed for Room {room['room_number']} via {platform_display}.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── WhatsApp webhook ──────────────────────────────────────────────────────────

@app.get("/whatsapp/webhook")
async def whatsapp_verify(
    hub_mode: Optional[str]        = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str]   = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed.")


def find_hotel_id_by_whatsapp(whatsapp_number: str) -> str:
    try:
        from firebase_service import get_db
        db = get_db()
        # Try finding a hotel matching this whatsappNumber
        if whatsapp_number:
            docs = db.collection("hotels").where("whatsappNumber", "==", whatsapp_number).stream()
            for doc in docs:
                return doc.id
        # Fallback to the first hotel document
        docs = db.collection("hotels").limit(1).stream()
        for doc in docs:
            return doc.id
    except Exception as e:
        print(f"[find_hotel_id_by_whatsapp] Error: {e}")
    return "hotel_grand_kolkata"


@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    try:
        body = await request.json()
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return {"status": "ok", "detail": "no_messages"}

        msg = messages[0]
        if msg.get("type") != "text":
            return {"status": "ok", "detail": "non_text_message"}

        guest_phone    = msg["from"]
        incoming_text  = msg["text"]["body"]

        metadata = value.get("metadata", {})
        receiver_phone = metadata.get("display_phone_number", "")
        # Resolve hotel context
        hotel_id = find_hotel_id_by_whatsapp(receiver_phone or guest_phone)

        print(f"[WhatsApp] Incoming from {guest_phone} for hotel {hotel_id}: {incoming_text}")

        # Run through AI agent with dynamic hotel context
        ai_response, intent = handle_guest_message(incoming_text, guest_phone, hotel_id)

        # Send AI response to guest
        send_text_message(guest_phone, ai_response)

        # If booking intent detected, process automatically
        if intent:
            # Query rooms of this hotel
            all_rooms = get_all_rooms(hotel_id)
            room_type_key = intent.get("room_type", "standard").lower()
            
            # Match room type key
            candidate_rooms = [
                r for r in all_rooms
                if room_type_key in r.get("type", "").lower() or room_type_key in r.get("typeName", "").lower()
            ]
            if not candidate_rooms:
                candidate_rooms = all_rooms

            check_in  = intent.get("check_in", "")
            check_out = intent.get("check_out", "")
            guest_name = intent.get("guest_name", "Guest")

            booked = False
            for room in candidate_rooms:
                room_id = room["id"]
                available, _ = check_availability(room_id, check_in, check_out)
                if available:
                    nights = (date.fromisoformat(check_out) - date.fromisoformat(check_in)).days
                    total  = nights * room.get("price_per_night", room.get("price", 1499))

                    booking = create_booking(
                        room_id=room_id,
                        guest_name=guest_name,
                        guest_phone=guest_phone,
                        check_in=check_in,
                        check_out=check_out,
                        source="whatsapp",
                        total_amount=total,
                        hotel_id=hotel_id,
                    )

                    create_notification(
                        message=f"AI-assisted WhatsApp booking: {guest_name} → Room {room.get('room_number', room.get('roomNumber', room_id))} ({check_in} to {check_out}).",
                        notif_type="booking_confirmed",
                        hotel_id=hotel_id,
                    )

                    send_booking_confirmation(guest_phone, {
                        "booking_id":   booking["booking_id"],
                        "room_type":    room.get("type", "Standard"),
                        "room_number":  room.get("room_number", room.get("roomNumber", room_id)),
                        "check_in":     check_in,
                        "check_out":    check_out,
                        "total_amount": total,
                    })
                    booked = True
                    break

            if not booked:
                send_text_message(
                    guest_phone,
                    f"I'm sorry, no {room_type_key} rooms are available for your selected dates. "
                    "Would you like to try different dates or another room type? 🙏",
                )

        return {"status": "ok"}

    except Exception as e:
        print(f"[WhatsApp] Webhook error: {e}")
        return {"status": "error", "detail": str(e)}


# ── Dashboard stats ───────────────────────────────────────────────────────────

@app.get("/dashboard/stats")
async def dashboard_stats(hotelId: Optional[str] = None):
    try:
        rooms    = get_all_rooms(hotelId)
        bookings = get_all_bookings(hotelId)

        today_str = date.today().isoformat()

        today_bookings = [
            b for b in bookings
            if b.get("check_in") == today_str and b.get("status") == "confirmed"
        ]

        confirmed_bookings = [b for b in bookings if b.get("status") == "confirmed"]

        total_rooms = len(rooms)
        booked_count = sum(1 for r in rooms if r.get("status") == "booked" or r.get("status") == "blocked")
        occupancy_pct = round((booked_count / total_rooms) * 100) if total_rooms else 0

        revenue_today = sum(b.get("total_amount", 0) for b in today_bookings)

        source_breakdown: dict[str, int] = {}
        for b in confirmed_bookings:
            src = b.get("source", "unknown")
            source_breakdown[src] = source_breakdown.get(src, 0) + 1

        room_status_summary = {
            r.get("room_number", r.get("roomNumber", r["id"])): r.get("status", "unknown") for r in rooms
        }

        return {
            "today_bookings": len(today_bookings),
            "occupancy_percentage": occupancy_pct,
            "available_rooms": total_rooms - booked_count,
            "total_rooms": total_rooms,
            "revenue_today": revenue_today,
            "bookings_by_source": source_breakdown,
            "room_status_summary": room_status_summary,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Room block ────────────────────────────────────────────────────────────────

@app.post("/rooms/block")
async def block_room_endpoint(req: BlockRoomRequest):
    try:
        room = get_room(req.room_id)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{req.room_id}' not found.")
        block_room(req.room_id, req.reason, req.start_date, req.end_date)
        return {"success": True, "message": f"Room {room.get('room_number', room.get('roomNumber', req.room_id))} blocked: {req.reason}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Bookings list ─────────────────────────────────────────────────────────────

@app.get("/bookings/list")
async def list_bookings(hotelId: Optional[str] = None):
    try:
        bookings = get_all_bookings(hotelId)
        return {"bookings": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Notifications list ────────────────────────────────────────────────────────

@app.get("/notifications/list")
async def list_notifications(hotelId: Optional[str] = None):
    try:
        from firebase_service import get_db
        db = get_db()
        if hotelId:
            docs = db.collection("notifications").where("hotelId", "==", hotelId).stream()
        else:
            docs = db.collection("notifications").stream()
        notifs = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            if "created_at" in d and hasattr(d["created_at"], "isoformat"):
                d["created_at"] = d["created_at"].isoformat()
            elif "created_at" not in d:
                d["created_at"] = ""
            notifs.append(d)
        # Sort newest first
        notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return {"notifications": notifs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    return {"status": "ok", "app": "StayOne API", "version": "1.0.0"}
