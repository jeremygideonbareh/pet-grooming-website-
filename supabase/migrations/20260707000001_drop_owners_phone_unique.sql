-- Drop the unique constraint on owners.phone that prevents multiple empty-phone signups.
ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_phone_key;
