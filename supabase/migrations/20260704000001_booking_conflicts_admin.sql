-- Prevent double-booking: unique constraint on active (pending/confirmed) slots.
-- Only applies when time_slot is set (Grooming), not for Training/Boarding (no time_slot).
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_unique
ON bookings (service_category, start_date, time_slot)
WHERE status IN ('pending', 'confirmed')
  AND time_slot IS NOT NULL AND time_slot != '';

-- Admin notes column for internal comments on bookings.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
