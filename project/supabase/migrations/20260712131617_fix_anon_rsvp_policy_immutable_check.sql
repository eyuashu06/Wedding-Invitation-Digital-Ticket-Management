-- Replace the tautological policy with one that actually enforces immutability
DROP POLICY IF EXISTS "anon_rsvp_guest" ON public.guests;

CREATE POLICY "anon_rsvp_guest" ON public.guests
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- Row must belong to an existing wedding (not orphaned)
    EXISTS (
      SELECT 1 FROM public.weddings w WHERE w.id = guests.wedding_id
    )
  )
  WITH CHECK (
    -- The proposed new row must still match the existing row's immutable identity columns.
    -- We fetch the current DB values and compare to what is being written.
    EXISTS (
      SELECT 1 FROM public.guests existing
      WHERE existing.id = guests.id
        AND existing.ticket_id  = guests.ticket_id   -- ticket_id cannot change
        AND existing.wedding_id = guests.wedding_id  -- cannot move guest to another wedding
        AND existing.full_name  = guests.full_name   -- cannot rename guest
    )
    -- Only RSVP-valid statuses; 'checked_in' is reserved for authenticated staff
    AND guests.attendance_status IN ('pending', 'confirmed', 'declined', 'maybe')
  );
