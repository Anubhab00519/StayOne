import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from datetime import datetime, date
import uuid

load_dotenv()

# ── Firebase initialisation ──────────────────────────────────────────────────
_app = None

def _init_firebase():
    global _app
    if _app is not None:
        return

    project_id    = os.getenv("FIREBASE_PROJECT_ID")
    client_email  = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key   = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")

    if project_id and client_email and private_key:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": "key",
            "private_key": private_key,
            "client_email": client_email,
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        _app = firebase_admin.initialize_app(cred)
    else:
        # Fallback: use Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS
        _app = firebase_admin.initialize_app()

def get_db():
    _init_firebase()
    return firestore.client()


# ── Seed Data ────────────────────────────────────────────────────────────────
HOTEL_DATA = {
    "name": "Hotel Grand Kolkata Inn",
    "address": "14 Park Street, Kolkata 700016",
    "phone": "+91 98300 12345",
    "checkin_time": "12:00 PM",
    "checkout_time": "11:00 AM",
    "amenities": ["Free WiFi", "AC", "Breakfast Included", "24hr Room Service", "Parking"],
}

ROOMS_DATA = [
    {
        "id": "room_101",
        "room_number": "101",
        "type": "Standard Double",
        "price_per_night": 1499,
        "max_guests": 2,
        "amenities": ["AC", "TV", "WiFi"],
        "photo_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "status": "available",
    },
    {
        "id": "room_102",
        "room_number": "102",
        "type": "Standard Double",
        "price_per_night": 1499,
        "max_guests": 2,
        "amenities": ["AC", "TV", "WiFi"],
        "photo_url": "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800",
        "status": "available",
    },
    {
        "id": "room_103",
        "room_number": "103",
        "type": "Deluxe Double",
        "price_per_night": 2499,
        "max_guests": 2,
        "amenities": ["AC", "TV", "WiFi", "Mini Bar", "City View"],
        "photo_url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
        "status": "available",
    },
    {
        "id": "room_104",
        "room_number": "104",
        "type": "Deluxe Double",
        "price_per_night": 2499,
        "max_guests": 2,
        "amenities": ["AC", "TV", "WiFi", "Mini Bar", "City View"],
        "photo_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
        "status": "available",
    },
    {
        "id": "room_105",
        "room_number": "105",
        "type": "Executive Suite",
        "price_per_night": 4999,
        "max_guests": 3,
        "amenities": ["AC", "TV", "WiFi", "Mini Bar", "City View", "Jacuzzi", "King Bed"],
        "photo_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
        "status": "available",
    },
]


def seed_data():
    """Seed hotel and room data into Firestore (idempotent)."""
    db = get_db()

    # Hotel document
    hotel_ref = db.collection("hotels").document("hotel_grand_kolkata")
    if not hotel_ref.get().exists:
        hotel_ref.set(HOTEL_DATA)
        print("[seed] Hotel document created.")
    else:
        print("[seed] Hotel document already exists, skipping.")

    # Rooms
    for room in ROOMS_DATA:
        room_id = room["id"]
        room_ref = db.collection("rooms").document(room_id)
        if not room_ref.get().exists:
            data = {k: v for k, v in room.items() if k != "id"}
            room_ref.set(data)
            print(f"[seed] Room {room_id} created.")
        else:
            print(f"[seed] Room {room_id} already exists, skipping.")


# ── Room helpers ─────────────────────────────────────────────────────────────
def get_all_rooms(hotel_id: str = None) -> list[dict]:
    db = get_db()
    if hotel_id:
        docs = db.collection("rooms").where("hotelId", "==", hotel_id).stream()
    else:
        docs = db.collection("rooms").stream()
    rooms = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        rooms.append(d)
    return rooms


def get_room(room_id: str) -> dict | None:
    db = get_db()
    doc = db.collection("rooms").document(room_id).get()
    if doc.exists:
        d = doc.to_dict()
        d["id"] = doc.id
        return d
    return None


def update_room_status(room_id: str, status: str):
    db = get_db()
    db.collection("rooms").document(room_id).update({"status": status})


# ── Booking helpers ──────────────────────────────────────────────────────────
def get_bookings_for_room(room_id: str) -> list[dict]:
    """Return all confirmed bookings for a given room."""
    db = get_db()
    docs = (
        db.collection("bookings")
        .where("room_id", "==", room_id)
        .where("status", "==", "confirmed")
        .stream()
    )
    bookings = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        bookings.append(d)
    return bookings


def get_all_bookings(hotel_id: str = None) -> list[dict]:
    db = get_db()
    if hotel_id:
        docs = db.collection("bookings").where("hotelId", "==", hotel_id).stream()
    else:
        docs = db.collection("bookings").order_by("created_at", direction=firestore.Query.DESCENDING).limit(100).stream()
    bookings = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        # Convert timestamps
        if "created_at" in d and hasattr(d["created_at"], "isoformat"):
            d["created_at"] = d["created_at"].isoformat()
        bookings.append(d)

    if hotel_id:
        # Sort client side to avoid index creation requirement
        bookings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return bookings


def create_booking(
    room_id: str,
    guest_name: str,
    guest_phone: str,
    check_in: str,
    check_out: str,
    source: str,
    total_amount: float,
    hotel_id: str = None,
    status: str = "confirmed",
    conflict_detected: bool = False,
) -> dict:
    db = get_db()
    booking_id = str(uuid.uuid4())[:8].upper()
    room = get_room(room_id)
    room_number = room["room_number"] if room else room_id
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Data written to Firestore uses SERVER_TIMESTAMP for accuracy
    firestore_data = {
        "booking_id": booking_id,
        "room_id": room_id,
        "room_number": room_number,
        "guest_name": guest_name,
        "guest_phone": guest_phone,
        "check_in": check_in,
        "check_out": check_out,
        "source": source,
        "status": status,
        "total_amount": total_amount,
        "created_at": firestore.SERVER_TIMESTAMP,
        "conflict_detected": conflict_detected,
    }
    if hotel_id:
        firestore_data["hotelId"] = hotel_id

    doc_ref = db.collection("bookings").document()
    doc_ref.set(firestore_data)

    # Update room status if confirmed
    if status == "confirmed":
        update_room_status(room_id, "booked")

    # Return a JSON-serializable dict (replace Sentinel with real timestamp)
    return {
        **firestore_data,
        "id": doc_ref.id,
        "created_at": now_iso,
    }


def create_notification(message: str, notif_type: str, hotel_id: str = None) -> dict:
    db = get_db()
    now_iso = datetime.utcnow().isoformat() + "Z"
    firestore_data = {
        "message": message,
        "type": notif_type,
        "read": False,
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    if hotel_id:
        firestore_data["hotelId"] = hotel_id

    doc_ref = db.collection("notifications").document()
    doc_ref.set(firestore_data)
    return {
        **firestore_data,
        "id": doc_ref.id,
        "created_at": now_iso,
    }


def block_room(room_id: str, reason: str, start_date: str, end_date: str):
    db = get_db()
    db.collection("rooms").document(room_id).update({
        "status": "blocked",
        "block_reason": reason,
        "block_start": start_date,
        "block_end": end_date,
    })
