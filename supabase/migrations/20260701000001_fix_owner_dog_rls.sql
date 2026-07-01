-- Fix RLS: Allow authenticated users to manage their own owners and dogs records.
-- The previous migration (20260628000002) only allowed anon INSERT and admin CRUD,
-- but forgot authenticated (non-admin) users need access to their own data.

-- 1. OWNERS — allow authenticated users to SELECT/UPDATE their own record
DROP POLICY IF EXISTS "Users can view own owner" ON owners;
DROP POLICY IF EXISTS "Users can update own owner" ON owners;
DROP POLICY IF EXISTS "Users can insert own owner" ON owners;

CREATE POLICY "Users can insert own owner" ON owners
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own owner" ON owners
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own owner" ON owners
  FOR UPDATE USING (auth.uid() = id);

-- 2. DOGS — allow authenticated users to INSERT/SELECT/UPDATE their own dogs
DROP POLICY IF EXISTS "Users can insert own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can view own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can update own dogs" ON dogs;

CREATE POLICY "Users can insert own dogs" ON dogs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view own dogs" ON dogs
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own dogs" ON dogs
  FOR UPDATE USING (auth.uid() = owner_id);
