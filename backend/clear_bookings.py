import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabase credentials not found in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("Clearing booking_sync_log...")
    supabase.table("booking_sync_log").delete().neq("status", "non-existent").execute()
    
    print("Clearing ota_bookings...")
    supabase.table("ota_bookings").delete().neq("guest_name", "non-existent").execute()
    
    print("Clearing bookings...")
    supabase.table("bookings").delete().neq("status", "non-existent").execute()
    
    print("All bookings cleared successfully! You can now start testing from scratch.")
except Exception as e:
    print(f"Error clearing bookings: {e}")
