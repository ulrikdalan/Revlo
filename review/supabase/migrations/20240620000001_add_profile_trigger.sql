-- Opprett funksjon for å håndtere nye brukere
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql;

-- Sjekk om trigger allerede eksisterer
drop trigger if exists on_auth_user_created on auth.users;

-- Opprett trigger for automatisk opprettelse av profiler for nye brukere
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure handle_new_user(); 