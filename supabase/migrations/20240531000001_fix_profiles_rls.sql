-- Disable RLS for profiles table to allow direct access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Add realtime publication for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
