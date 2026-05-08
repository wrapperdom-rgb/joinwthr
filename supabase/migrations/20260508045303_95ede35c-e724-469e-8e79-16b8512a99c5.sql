-- Storage bucket for post images
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Public read
create policy "post-images public read"
on storage.objects for select
using (bucket_id = 'post-images');

-- Auth users upload to their own folder (auth.uid()/...)
create policy "post-images auth upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "post-images owner delete"
on storage.objects for delete to authenticated
using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_url column to posts
alter table public.posts add column if not exists image_url text;