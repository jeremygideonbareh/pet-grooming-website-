-- Tighten RLS policies for production security.
-- Principles:
--   - Public (anon): SELECT only on products, site_content, storage objects
--   - Admin: full CRUD, identified by JWT email whitelist
--   - Bookings: anon INSERT (booking form), users SELECT own, admin SELECT/UPDATE all
--   - Owners/Dogs: anon INSERT (signup/booking), users manage own, admin read/write/delete

-- ── 1. PRODUCTS ──────────────────────────────────
DROP POLICY IF EXISTS "Allow public all access to products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admin can insert products" ON products;
DROP POLICY IF EXISTS "Admin can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;

CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert products" ON products
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can update products" ON products
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can delete products" ON products
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

-- ── 2. SITE_CONTENT ──────────────────────────────
DROP POLICY IF EXISTS "Allow public all access to site_content" ON site_content;
DROP POLICY IF EXISTS "Public can view site content" ON site_content;
DROP POLICY IF EXISTS "Admin can insert site content" ON site_content;
DROP POLICY IF EXISTS "Admin can update site content" ON site_content;

CREATE POLICY "Public can view site content" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert site content" ON site_content
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can update site content" ON site_content
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

-- ── 3. STORAGE OBJECTS (a1-images bucket) ────────
DROP POLICY IF EXISTS "Allow public all access to a1-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view a1-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload a1-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update a1-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete a1-images" ON storage.objects;

CREATE POLICY "Public can view a1-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'a1-images');

CREATE POLICY "Admin can upload a1-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'a1-images' AND
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can update a1-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'a1-images' AND
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can delete a1-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'a1-images' AND
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

-- ── 4. BOOKINGS ──────────────────────────────────
DROP POLICY IF EXISTS "Allow admin to read bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public to insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon to insert bookings" ON bookings;

-- No DELETE needed for bookings (admin panel only updates status)

CREATE POLICY "Allow anon to insert bookings" ON bookings
  FOR INSERT TO anon WITH CHECK (true);

-- Keep these existing policies:
--   "Users can view own bookings"        → auth.uid() = owner_id
--   "Users can insert own bookings"      → auth.uid() = owner_id
--   "Admins can view all bookings"       → email whitelist
--   "Admins can update bookings"         → email whitelist

-- ── 5. OWNERS ────────────────────────────────────
DROP POLICY IF EXISTS "Allow admin to read owners" ON owners;
DROP POLICY IF EXISTS "Allow admin to update owners" ON owners;
DROP POLICY IF EXISTS "Allow admin to delete owners" ON owners;
DROP POLICY IF EXISTS "Allow public to insert owners" ON owners;
DROP POLICY IF EXISTS "Allow anon to insert owners" ON owners;
DROP POLICY IF EXISTS "Admin can read owners" ON owners;
DROP POLICY IF EXISTS "Admin can update owners" ON owners;
DROP POLICY IF EXISTS "Admin can delete owners" ON owners;

CREATE POLICY "Allow anon to insert owners" ON owners
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can read owners" ON owners
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can update owners" ON owners
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can delete owners" ON owners
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

-- ── 6. DOGS ──────────────────────────────────────
DROP POLICY IF EXISTS "Allow admin to read dogs" ON dogs;
DROP POLICY IF EXISTS "Allow admin to update dogs" ON dogs;
DROP POLICY IF EXISTS "Allow admin to delete dogs" ON dogs;
DROP POLICY IF EXISTS "Allow public to insert dogs" ON dogs;
DROP POLICY IF EXISTS "Allow anon to insert dogs" ON dogs;
DROP POLICY IF EXISTS "Admin can read dogs" ON dogs;
DROP POLICY IF EXISTS "Admin can update dogs" ON dogs;
DROP POLICY IF EXISTS "Admin can delete dogs" ON dogs;

CREATE POLICY "Allow anon to insert dogs" ON dogs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can read dogs" ON dogs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can update dogs" ON dogs
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );

CREATE POLICY "Admin can delete dogs" ON dogs
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'a1.enterprises8891@gmail.com',
      'cloudlyconfusing@gmail.com',
      '9233485873@a1.com'
    ])
  );
