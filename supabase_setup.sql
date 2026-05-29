-- ============================================================
-- STAYONE SaaS DATABASE SCHEMA (V7 - INVERSE CONNECTION)
-- ============================================================

DROP TABLE IF EXISTS ota_bookings CASCADE;
DROP TABLE IF EXISTS ota_rooms CASCADE;
DROP TABLE IF EXISTS ota_hotels CASCADE;
DROP TABLE IF EXISTS booking_sync_log CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS allowed_emails CASCADE;

-- ============================================================
-- PART 1: STAYONE MASTER (Channel Manager)
-- ============================================================

CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hotels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  location         TEXT,
  city             TEXT NOT NULL,
  description      TEXT,
  rating           DECIMAL(2,1) DEFAULT 4.0,
  amenities        TEXT[] DEFAULT '{}',
  owner_email      TEXT UNIQUE NOT NULL,
  owner_phone      TEXT,
  password         TEXT NOT NULL DEFAULT 'hotel123',
  mmt_hotel_code   TEXT, -- The hotel_code from MMT
  goibibo_hotel_code TEXT, -- The hotel_code from Goibibo
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rooms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number    TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('standard','deluxe','suite')),
  rate_per_night INT NOT NULL,
  facilities     TEXT,
  max_guests     INT DEFAULT 2,
  UNIQUE(hotel_id, room_number)
);

CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name   TEXT NOT NULL,
  guest_email  TEXT,
  guest_phone  TEXT,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  total_amount INT NOT NULL,
  status       TEXT DEFAULT 'confirmed',
  source       TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE booking_sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  target_platform TEXT NOT NULL,
  room_number     TEXT NOT NULL,
  action          TEXT NOT NULL DEFAULT 'block',
  status          TEXT NOT NULL DEFAULT 'success',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PART 2: INDEPENDENT OTA SYSTEMS
-- ============================================================

CREATE TABLE ota_hotels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_code       TEXT UNIQUE NOT NULL, -- e.g. MMT-A1B2C3
  platform         TEXT NOT NULL CHECK (platform IN ('makemytrip','goibibo')),
  name             TEXT NOT NULL,
  city             TEXT NOT NULL,
  location         TEXT,
  description      TEXT,
  rating           DECIMAL(2,1) DEFAULT 4.0,
  amenities        TEXT[] DEFAULT '{}',
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ota_rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ota_hotel_id UUID NOT NULL REFERENCES ota_hotels(id) ON DELETE CASCADE,
  room_number  TEXT NOT NULL,
  category     TEXT NOT NULL,
  rate         INT NOT NULL,
  facilities   TEXT,
  max_guests   INT DEFAULT 2
);

CREATE TABLE ota_bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ota_room_id UUID NOT NULL REFERENCES ota_rooms(id) ON DELETE CASCADE,
  guest_name  TEXT NOT NULL,
  guest_phone TEXT,
  check_in    DATE NOT NULL,
  check_out   DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEED DATA 
-- ============================================================

-- MMT Hotels
INSERT INTO ota_hotels (hotel_code, platform, name, city, location, description, rating, amenities, image_url) VALUES
('MMT-BOM101','makemytrip','Hotel Sunrise Palace','Mumbai','Andheri West','Stunning city views with premium amenities.',4.3,ARRAY['WiFi','Pool','Gym'],'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'),
('MMT-BOM102','makemytrip','The Marine Boutique','Mumbai','Marine Drive','Sea-facing luxury boutique hotel.',4.7,ARRAY['WiFi','Spa','Restaurant'],'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'),
('MMT-CCU201','makemytrip','The Grand Bengal','Kolkata','Park Street','Heritage luxury in the heart of the city.',4.5,ARRAY['WiFi','Restaurant','Bar'],'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'),
('MMT-CCU202','makemytrip','Salt Lake Business Inn','Kolkata','Salt Lake','Perfect for business travelers.',4.0,ARRAY['WiFi','Conference Room'],'https://images.unsplash.com/photo-1522771731535-6ac2149ce013?w=800'),
('MMT-DEL301','makemytrip','Delhi Heights','Delhi','Connaught Place','Modern stays near historic sites.',4.2,ARRAY['WiFi','Breakfast'],'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'),
('MMT-BLR401','makemytrip','Tech Park Suites','Bangalore','Whitefield','Premium suites for IT professionals.',4.4,ARRAY['WiFi','Gym','Pool'],'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'),
('MMT-GOA501','makemytrip','Beachfront Resort','Goa','Baga Beach','Step right onto the sand.',4.8,ARRAY['WiFi','Pool','Bar','Beach Access'],'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800');

-- MMT Rooms
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '101', 'deluxe', 4500, 'AC, TV', 2 FROM ota_hotels WHERE hotel_code = 'MMT-BOM101';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '201', 'suite', 8500, 'AC, Sea View', 2 FROM ota_hotels WHERE hotel_code = 'MMT-BOM102';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '101', 'suite', 9500, 'AC, King Bed', 4 FROM ota_hotels WHERE hotel_code = 'MMT-CCU201';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '101', 'standard', 3000, 'AC, Desk', 2 FROM ota_hotels WHERE hotel_code = 'MMT-CCU202';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '301', 'deluxe', 5500, 'AC, Minibar', 2 FROM ota_hotels WHERE hotel_code = 'MMT-DEL301';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '401', 'suite', 7500, 'AC, Workspace', 2 FROM ota_hotels WHERE hotel_code = 'MMT-BLR401';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '501', 'deluxe', 6500, 'AC, Balcony', 2 FROM ota_hotels WHERE hotel_code = 'MMT-GOA501';

-- Goibibo Hotels
INSERT INTO ota_hotels (hotel_code, platform, name, city, location, description, rating, amenities, image_url) VALUES
('GOI-BOM101','goibibo','Hotel Sunrise Palace','Mumbai','Andheri West','Stunning city views with premium amenities.',4.3,ARRAY['WiFi','Pool','Gym'],'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'),
('GOI-BOM102','goibibo','The Marine Boutique','Mumbai','Marine Drive','Sea-facing luxury boutique hotel.',4.7,ARRAY['WiFi','Spa','Restaurant'],'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'),
('GOI-CCU201','goibibo','The Grand Bengal','Kolkata','Park Street','Heritage luxury in the heart of the city.',4.5,ARRAY['WiFi','Restaurant','Bar'],'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'),
('GOI-CCU202','goibibo','Salt Lake Business Inn','Kolkata','Salt Lake','Perfect for business travelers.',4.0,ARRAY['WiFi','Conference Room'],'https://images.unsplash.com/photo-1522771731535-6ac2149ce013?w=800'),
('GOI-DEL301','goibibo','Delhi Heights','Delhi','Connaught Place','Modern stays near historic sites.',4.2,ARRAY['WiFi','Breakfast'],'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'),
('GOI-BLR401','goibibo','Tech Park Suites','Bangalore','Whitefield','Premium suites for IT professionals.',4.4,ARRAY['WiFi','Gym','Pool'],'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'),
('GOI-GOA501','goibibo','Beachfront Resort','Goa','Baga Beach','Step right onto the sand.',4.8,ARRAY['WiFi','Pool','Bar','Beach Access'],'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800');

-- Goibibo Rooms
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '101', 'deluxe', 4500, 'AC, TV', 2 FROM ota_hotels WHERE hotel_code = 'GOI-BOM101';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '201', 'suite', 8500, 'AC, Sea View', 2 FROM ota_hotels WHERE hotel_code = 'GOI-BOM102';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '101', 'suite', 9500, 'AC, King Bed', 4 FROM ota_hotels WHERE hotel_code = 'GOI-CCU201';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '101', 'standard', 3000, 'AC, Desk', 2 FROM ota_hotels WHERE hotel_code = 'GOI-CCU202';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '301', 'deluxe', 5500, 'AC, Minibar', 2 FROM ota_hotels WHERE hotel_code = 'GOI-DEL301';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '401', 'suite', 7500, 'AC, Workspace', 2 FROM ota_hotels WHERE hotel_code = 'GOI-BLR401';
INSERT INTO ota_rooms (ota_hotel_id, room_number, category, rate, facilities, max_guests)
SELECT id, '501', 'deluxe', 6500, 'AC, Balcony', 2 FROM ota_hotels WHERE hotel_code = 'GOI-GOA501';

-- Row Level Security
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access" ON allowed_emails FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON hotels FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON rooms FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON bookings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON booking_sync_log FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON ota_hotels FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON ota_rooms FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON ota_bookings FOR ALL TO anon USING (true) WITH CHECK (true);
