
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'dodo',
  provider_payment_id text,
  provider_event_id text UNIQUE,
  amount_cents integer NOT NULL DEFAULT 1000,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read payments" ON public.payments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
