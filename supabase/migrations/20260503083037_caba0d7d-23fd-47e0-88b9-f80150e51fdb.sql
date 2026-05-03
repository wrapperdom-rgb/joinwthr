
ALTER TABLE public.posts ADD CONSTRAINT posts_author_profile_fk FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_author_profile_fk FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
