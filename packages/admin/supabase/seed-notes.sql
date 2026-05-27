-- Create the notes table
create table notes (
  id bigint primary key generated always as identity,
  title text not null
);

-- Insert sample data
insert into notes (title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');

-- Enable Row Level Security
alter table notes enable row level security;

-- Make data publicly readable
create policy "public can read notes"
on public.notes
for select to anon
using (true);
