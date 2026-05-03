
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_banned(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT banned FROM public.profiles WHERE id = _uid), false)
$$;

DROP POLICY IF EXISTS "users insert own posts" ON public.posts;
CREATE POLICY "users insert own posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "reply own" ON public.post_replies;
CREATE POLICY "reply own" ON public.post_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "msg send as self" ON public.messages;
CREATE POLICY "msg send as self" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "opps insert own" ON public.opportunities;
CREATE POLICY "opps insert own" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.is_banned(auth.uid()));

INSERT INTO public.user_roles (user_id, role)
VALUES ('7106380b-e864-4ba3-95ab-c883c72efa28', 'admin')
ON CONFLICT DO NOTHING;
