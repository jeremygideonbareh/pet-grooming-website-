-- Migration: clean up duplicate booking email triggers; use single canonical trigger with dynamic JWT

-- Step 1: Drop both existing INSERT triggers on bookings
DROP TRIGGER IF EXISTS "Trigger Email on Booking" ON public.bookings;
DROP TRIGGER IF EXISTS trg_send_booking_email ON public.bookings;

-- Step 2: Drop old send_booking_email_trigger function
DROP FUNCTION IF EXISTS public.send_booking_email_trigger();

-- Step 3: Store the service-role JWT in Supabase vault
SELECT vault.create_secret(
  '<SERVICE_ROLE_JWT_PLACEHOLDER>',  -- substituted at runtime; vault already has the real value
  'send_booking_ef_jwt',
  'Service role key for booking email edge function trigger'
);

-- Step 4: Create new clean trigger function
CREATE FUNCTION public.send_booking_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt TEXT;
  v_payload JSONB;
  v_url TEXT := 'https://hqgdifxecxrxhjsbavkl.supabase.co/functions/v1/send-booking-email';
BEGIN
  SELECT decrypted_secret INTO v_jwt
    FROM vault.decrypted_secrets
    WHERE name = 'send_booking_ef_jwt'
    LIMIT 1;

  IF v_jwt IS NULL THEN
    RAISE WARNING 'No JWT in vault for send_booking_ef_jwt; skipping email trigger';
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object('record', row_to_json(NEW));

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_jwt
    ),
    body := v_payload,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- Step 5: Create canonical trigger
CREATE TRIGGER trg_send_booking_email
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.send_booking_email_trigger();
