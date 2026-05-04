-- Mark bot accounts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Activity log for bots
CREATE TABLE IF NOT EXISTS public.bot_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid,
  action text NOT NULL,
  target_id uuid,
  content text,
  success boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read bot_runs" ON public.bot_runs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete bot_runs" ON public.bot_runs
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Extensions for cron-driven bot runs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;