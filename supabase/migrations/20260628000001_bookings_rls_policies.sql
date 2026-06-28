-- Enable RLS on bookings table (idempotent)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;

-- Policy: authenticated users can insert bookings (must match their owner_id)
CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: authenticated users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: admin users can view all bookings (checked via JWT email claim)
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    )
  );

-- Policy: admin users can update booking status
CREATE POLICY "Admins can update bookings" ON bookings
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    )
  );
