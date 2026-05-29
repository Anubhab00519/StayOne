import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are the AI booking assistant for Hotel Grand Kolkata Inn, a premium hotel at 14 Park Street, Kolkata 700016. You handle all guest inquiries and bookings via WhatsApp.

Hotel details:
- Check-in: 12:00 PM, Check-out: 11:00 AM
- Amenities: Free WiFi, AC, Breakfast Included, 24hr Room Service, Parking
- Contact: +91 98300 12345

Available room types:
- Standard Double (Rooms 101, 102): ₹1,499/night, max 2 guests, AC, TV, WiFi
- Deluxe Double (Rooms 103, 104): ₹2,499/night, max 2 guests, AC, TV, WiFi, Mini Bar, City View
- Executive Suite (Room 105): ₹4,999/night, max 3 guests, AC, TV, WiFi, Mini Bar, City View, Jacuzzi, King Bed

Your behavior:
- Greet warmly and ask how you can help
- When asked about rooms, describe all options with prices and say you will send the catalogue
- When a guest wants to book, collect: check-in date, check-out date, number of guests, preferred room type
- Once you have all details, confirm the booking and say a confirmation will follow shortly
- Answer FAQs about the hotel naturally
- Respond in the same language the guest uses (Hindi or English)
- Keep responses concise for WhatsApp
- Never make up information not provided above

When you determine a guest wants to book and you have collected all required information, end your response with exactly this JSON on a new line:
BOOKING_INTENT: {
  "room_type": "standard|deluxe|suite",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "guest_name": "name",
  "guests": number
}"""

# In-memory conversation history keyed by phone number (simple per-session state)
_conversation_histories: dict[str, list[dict]] = {}


def _get_history(phone: str) -> list[dict]:
    if phone not in _conversation_histories:
        _conversation_histories[phone] = []
    return _conversation_histories[phone]


def _parse_booking_intent(text: str) -> dict | None:
    """Extract BOOKING_INTENT JSON from the AI response if present."""
    match = re.search(r"BOOKING_INTENT:\s*(\{.*?\})", text, re.DOTALL)
    if not match:
        return None
    try:
        raw = match.group(1)
        # Replace single quotes with double quotes for valid JSON
        raw = raw.replace("'", '"')
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def handle_guest_message(incoming_message: str, guest_phone: str, hotel_id: str = None) -> tuple[str, dict | None]:
    """
    Process a guest WhatsApp message through the Groq AI agent.

    Returns:
        (ai_response_text, booking_intent_dict | None)
    """
    if not GROQ_API_KEY:
        return (
            "Thank you for contacting StayOne! Our AI assistant is currently "
            "being set up. Please call us for immediate assistance.",
            None,
        )

    # Dynamically build system prompt if hotel_id is provided
    prompt = SYSTEM_PROMPT
    if hotel_id:
        try:
            from firebase_service import get_db
            db = get_db()
            doc = db.collection("hotels").document(hotel_id).get()
            if doc.exists:
                h = doc.to_dict()
                name = h.get("name", "Hotel")
                address = h.get("address", "")
                phone = h.get("phone", "")
                check_in = h.get("checkInTime", "12:00 PM")
                check_out = h.get("checkOutTime", "11:00 AM")
                amenities = ", ".join(h.get("amenities", []))
                
                # Build room description dynamically
                room_types_desc = []
                for rt in h.get("roomTypes", []):
                    rt_name = rt.get("name", "Room Type")
                    rt_price = rt.get("price", "N/A")
                    rt_max = rt.get("maxGuests", 2)
                    rt_amenities = ", ".join(rt.get("amenities", []))
                    room_types_desc.append(f"- {rt_name}: ₹{rt_price}/night, max {rt_max} guests, amenities: {rt_amenities}")
                
                rooms_str = "\n".join(room_types_desc) if room_types_desc else "Standard Rooms"
                
                prompt = f"""You are the AI booking assistant for {name}, located at {address}. You handle guest inquiries and bookings via WhatsApp.

Hotel details:
- Check-in: {check_in}, Check-out: {check_out}
- Amenities: {amenities}
- Contact: {phone}

Available room types:
{rooms_str}

Your behavior:
- Greet warmly and ask how you can help
- When asked about rooms, describe options with prices
- When a guest wants to book, collect: check-in date, check-out date, number of guests, preferred room type
- Once you have all details, confirm the booking and say a confirmation will follow shortly
- Answer FAQs about the hotel naturally
- Respond in the same language the guest uses (Hindi or English)
- Keep responses concise for WhatsApp
- Never make up information not provided above

When you determine a guest wants to book and you have collected all required information, end your response with exactly this JSON on a new line:
BOOKING_INTENT: {{
  "room_type": "standard|deluxe|suite",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "guest_name": "name",
  "guests": number
}}"""
        except Exception as e:
            print(f"[AI Agent] Failed to query dynamic hotel profile: {e}")

    client = Groq(api_key=GROQ_API_KEY)
    history = _get_history(guest_phone)

    # Append user message
    history.append({"role": "user", "content": incoming_message})

    messages = [{"role": "system", "content": prompt}] + history

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        ai_text = completion.choices[0].message.content.strip()

        # Append assistant response to history
        history.append({"role": "assistant", "content": ai_text})

        # Keep history manageable (last 20 messages)
        if len(history) > 20:
            _conversation_histories[guest_phone] = history[-20:]

        # Parse booking intent
        intent = _parse_booking_intent(ai_text)

        # Strip the BOOKING_INTENT JSON from the message sent to guest
        clean_text = re.sub(r"\nBOOKING_INTENT:.*", "", ai_text, flags=re.DOTALL).strip()

        return clean_text, intent

    except Exception as e:
        print(f"[AI Agent] Groq API error: {e}")
        return (
            "I'm sorry, I'm having trouble right now. Please contact the hotel directly.",
            None,
        )
