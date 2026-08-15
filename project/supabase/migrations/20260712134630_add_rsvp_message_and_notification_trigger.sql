-- Add rsvp_message column to guests for congratulatory messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'rsvp_message' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.guests ADD COLUMN rsvp_message text;
  END IF;
END $$;

-- Add dietary_preferences column to guests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'dietary_preferences' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.guests ADD COLUMN dietary_preferences text;
  END IF;
END $$;

-- Function: insert a notification when a guest RSVP status changes (via trigger)
CREATE OR REPLACE FUNCTION public.notify_rsvp_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_organizer_id uuid;
  v_wedding_title text;
  v_status_label text;
BEGIN
  -- Only fire when attendance_status actually changes to a non-pending value
  IF (NEW.attendance_status = OLD.attendance_status) THEN
    RETURN NEW;
  END IF;
  IF (NEW.attendance_status = 'pending') THEN
    RETURN NEW;
  END IF;

  -- Get the wedding organizer and title
  SELECT organizer_id, COALESCE(title, bride_name || ' & ' || groom_name)
  INTO v_organizer_id, v_wedding_title
  FROM public.weddings WHERE id = NEW.wedding_id;

  v_status_label := CASE NEW.attendance_status
    WHEN 'confirmed' THEN 'accepted'
    WHEN 'declined'  THEN 'declined'
    WHEN 'maybe'     THEN 'marked maybe'
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

-- Attach the trigger to guests table
DROP TRIGGER IF EXISTS trg_rsvp_notify ON public.guests;
CREATE TRIGGER trg_rsvp_notify
  AFTER UPDATE OF attendance_status ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.notify_rsvp_change();
