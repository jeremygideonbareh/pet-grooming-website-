ALTER TABLE bookings ADD COLUMN pickup_required BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN pickup_address TEXT DEFAULT '';
