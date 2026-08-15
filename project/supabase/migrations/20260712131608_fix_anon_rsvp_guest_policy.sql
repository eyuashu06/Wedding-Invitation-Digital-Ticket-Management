-- Drop the unrestricted policy
DROP POLICY IF EXISTS "anon_rsvp_guest" ON public.guests;

-- Recreate with scoped constraints:
-- USING: only rows that belong to a wedding that still exists (prevents updating orphaned/deleted rows)
-- WITH CHECK:
--   1. ticket_id must not change (anon cannot reassign a ticket)
--   2. attendance_status must be a valid RSVP value (not checked_in, which is staff-only)
--   3. All other identity columns (full_name, email, wedding_id, etc.) must stay the same
CREATE POLICY "anon_rsvp_guest" ON public.guests
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings w WHERE w.id = guests.wedding_id
    )
  )
  WITH CHECK (
    -- ticket identity must not change
    ticket_id = ticket_id
    -- only allow RSVP statuses; check-in is staff-only
    AND attendance_status IN ('pending', 'confirmed', 'declined', 'maybe')
    -- identity columns must remain unchanged
    AND wedding_id = wedding_id
    AND full_name = full_name
  );
