-- Funksjon for å hente antall e-poster sendt per dag
create or replace function get_email_counts_per_day()
returns table(send_date date, email_count int)
language sql
as $$
  select
    date_trunc('day', sent_at)::date as send_date,
    count(*) as email_count
  from sent_emails
  group by 1
  order by 1 desc;
$$;

-- Gi tilgang til denne funksjonen
GRANT EXECUTE ON FUNCTION get_email_counts_per_day() TO service_role; 