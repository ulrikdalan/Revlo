-- Create or replace the get_pending_reminders function
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS SETOF sent_emails
LANGUAGE sql
AS $$
SELECT *
FROM sent_emails
WHERE clicked_at IS NULL
  AND reminder_sent_at IS NULL
  AND sent_at < now() - INTERVAL '3 days';
$$; 