
-- Wire the existing handle_new_user function to a trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any auth users missing a profile
INSERT INTO public.profiles (id, handle, name)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'handle', 'user_' || substr(u.id::text, 1, 8)),
       COALESCE(u.raw_user_meta_data->>'name', 'Founder')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
