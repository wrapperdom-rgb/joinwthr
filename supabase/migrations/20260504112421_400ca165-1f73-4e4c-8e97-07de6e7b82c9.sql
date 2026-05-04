CREATE TABLE public.access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  url TEXT,
  revenue_stage TEXT NOT NULL,
  why TEXT NOT NULL,
  referrer TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit access requests"
ON public.access_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins read access requests"
ON public.access_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update access requests"
ON public.access_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete access requests"
ON public.access_requests FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_access_requests_status ON public.access_requests(status, created_at DESC);