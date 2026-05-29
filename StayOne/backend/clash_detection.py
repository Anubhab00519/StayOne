from datetime import date
from firebase_service import get_bookings_for_room


def _parse_date(d: str) -> date:
    return date.fromisoformat(d)


def check_availability(room_id: str, check_in: str, check_out: str) -> tuple[bool, dict | None]:
    """
    Check if a room is available for the given date range.

    Returns:
        (True, None)         — room is available
        (False, booking_dict) — room is NOT available; conflicting booking returned
    """
    req_in  = _parse_date(check_in)
    req_out = _parse_date(check_out)

    existing_bookings = get_bookings_for_room(room_id)

    for booking in existing_bookings:
        ex_in  = _parse_date(booking["check_in"])
        ex_out = _parse_date(booking["check_out"])

        # Overlap condition: two ranges overlap if neither ends before the other starts
        # [req_in, req_out) overlaps [ex_in, ex_out) if req_in < ex_out AND req_out > ex_in
        if req_in < ex_out and req_out > ex_in:
            return False, booking

    return True, None
