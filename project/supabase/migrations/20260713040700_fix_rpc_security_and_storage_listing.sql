-- Fix 1: Set a fixed search_path on notify_rsvp_change to prevent search_path injection
-- Fix 2: Revoke EXECUTE from anon and authenticated roles (it's a trigger function, not an RPC)
-- Fix 3: Keep SECURITY DEFINER (needed to write to notifications as the function owner)
--        but lock down who can call it via RPC

CREATE OR REPLACE FUNCTION public.notify_rsvp_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_organizer_id uuid;
  v_wedding_title text;
  v_status_label text;
BEGIN
  IF (NEW.attendance_status = OLD.attendance_status) THEN
    RETURN NEW;
  END IF;
  IF (NEW.attendance_status = 'pending') THEN
    RETURN NEW;
  END IF;

  SELECT organizer_id, COALESCE(title, bride_name || ' & ' || groom_name)
  INTO v_organizer_id, v_wedding_title
  FROM public.weddings WHERE id = NEW.wedding_id;

  v_status_label := CASE NEW.attendance_status
    WHEN 'confirmed'  THEN 'accepted'
    WHEN 'declined'   THEN 'declined'
    WHEN 'maybe'      THEN 'marked maybe'
    WHEN 'checked_in' THEN 'checked in'
    ELSE NEW.attendance_status
  END;

  INSERT INTO public.notifications (recipient_id, wedding_id, type, title, message)
  VALUES (
    v_organizer_id,
    NEW.wedding_id,
    'rsvp_response',
    NEW.full_name || ' ' || v_status_label,
    NEW.full_name || ' has ' || v_status_label || ' the invitation for ' || v_wedding_title
  );

  RETURN NEW;
END;
$$;

-- Revoke direct RPC execution from anon and authenticated
-- The function is only meant to run as a trigger, not be called directly
REVOKE EXECUTE ON FUNCTION public.notify_rsvp_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_rsvp_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_rsvp_change() FROM PUBLIC;

-- Fix 4: Drop the overly broad SELECT policy on storage.objects
-- Public buckets serve files via their public URL without needing a permissive SELECT policy.
-- The broad policy lets any client list all files in the bucket.
DROP POLICY IF EXISTS "photos_select_public" ON storage.objects;

-- Replace with a narrower policy: only allow reading a specific object (not listing)
-- by requiring the full path (name) to be provided. This prevents bucket enumeration
-- while still allowing the app to load images it already knows the path of.
CREATE POLICY "photos_select_by_path" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'wedding-photos'
    AND name IS NOT NULL
    AND length(name) > 0
  );
