-- Funksjon for å hente antall sendte e-poster per bruker
CREATE OR REPLACE FUNCTION get_email_counts_by_user()
RETURNS TABLE (
  user_id uuid,
  count text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sent_emails.user_id, 
    COUNT(sent_emails.id)::text as count
  FROM 
    sent_emails
  GROUP BY 
    sent_emails.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funksjon for å hente antall klikk per bruker
CREATE OR REPLACE FUNCTION get_click_counts_by_user()
RETURNS TABLE (
  user_id uuid,
  count text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sent_emails.user_id, 
    COUNT(sent_emails.id)::text as count
  FROM 
    sent_emails
  WHERE 
    sent_emails.clicked_at IS NOT NULL
  GROUP BY 
    sent_emails.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gi tilgang til disse funksjonene
GRANT EXECUTE ON FUNCTION get_email_counts_by_user() TO service_role;
GRANT EXECUTE ON FUNCTION get_click_counts_by_user() TO service_role; 