import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN    = os.getenv("WHATSAPP_TOKEN", "")
PHONE_NUMBER_ID   = os.getenv("PHONE_NUMBER_ID", "")
BASE_URL          = f"https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }


def _post(payload: dict) -> dict:
    """Send a WhatsApp API request. Silently logs errors if credentials are missing."""
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        print(f"[WhatsApp] Credentials not configured — message not sent. Payload: {payload}")
        return {"status": "skipped", "reason": "credentials_missing"}

    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(BASE_URL, json=payload, headers=_headers())
            r.raise_for_status()
            return r.json()
    except Exception as e:
        print(f"[WhatsApp] API error: {e}")
        return {"status": "error", "detail": str(e)}


def send_text_message(phone: str, message: str) -> dict:
    """Send a plain text WhatsApp message."""
    # Normalise phone — ensure it starts with country code, no +
    phone = phone.lstrip("+").replace(" ", "").replace("-", "")

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message,
        },
    }
    return _post(payload)


ROOM_CATALOGUE = [
    {
        "photo_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "caption": (
            "🛏️ *Standard Double* — Rooms 101 & 102\n"
            "₹1,499/night | Max 2 guests\n"
            "✅ AC, TV, WiFi\n\n"
            "Reply with *STANDARD* to book this room."
        ),
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
        "caption": (
            "🛏️ *Deluxe Double* — Rooms 103 & 104\n"
            "₹2,499/night | Max 2 guests\n"
            "✅ AC, TV, WiFi, Mini Bar, City View\n\n"
            "Reply with *DELUXE* to book this room."
        ),
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
        "caption": (
            "👑 *Executive Suite* — Room 105\n"
            "₹4,999/night | Max 3 guests\n"
            "✅ AC, TV, WiFi, Mini Bar, City View, Jacuzzi, King Bed\n\n"
            "Reply with *SUITE* to book this room."
        ),
    },
]


def send_room_catalogue(phone: str) -> None:
    """Send one image message per room type with a 0.5s delay between each."""
    phone = phone.lstrip("+").replace(" ", "").replace("-", "")
    for room in ROOM_CATALOGUE:
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "image",
            "image": {
                "link": room["photo_url"],
                "caption": room["caption"],
            },
        }
        _post(payload)
        time.sleep(0.5)


def send_booking_confirmation(phone: str, booking_details: dict) -> dict:
    """Send a formatted booking confirmation message."""
    message = (
        f"✅ *Booking Confirmed!*\n\n"
        f"🔖 Booking ID: *{booking_details.get('booking_id', 'N/A')}*\n"
        f"🛏️ Room: *{booking_details.get('room_type', '')} — Room {booking_details.get('room_number', '')}*\n"
        f"📅 Check-in: *{booking_details.get('check_in', '')}* at 12:00 PM\n"
        f"📅 Check-out: *{booking_details.get('check_out', '')}* by 11:00 AM\n"
        f"💰 Total Amount: *₹{booking_details.get('total_amount', 0):,.0f}*\n\n"
        f"📍 *Hotel Grand Kolkata Inn*\n"
        f"14 Park Street, Kolkata 700016\n"
        f"📞 +91 98300 12345\n\n"
        f"_Reply to this message for any queries. We look forward to hosting you!_ 🙏"
    )
    return send_text_message(phone, message)
