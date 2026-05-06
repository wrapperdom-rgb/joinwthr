import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const raw = await req.text();
  const secret = Deno.env.get('DODO_WEBHOOK_SECRET')!;

  const headers = {
    'webhook-id': req.headers.get('webhook-id') || '',
    'webhook-signature': req.headers.get('webhook-signature') || '',
    'webhook-timestamp': req.headers.get('webhook-timestamp') || '',
  };

  let payload: any;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(raw, headers);
  } catch (e) {
    console.error('signature verify failed', e);
    return new Response('invalid signature', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const type = payload.type || payload.event_type;
    const data = payload.data || payload;
    const userId = data?.metadata?.user_id;
    const paymentId = data?.payment_id || data?.id;
    const status = data?.status || (type?.includes('succeeded') ? 'succeeded' : 'pending');

    console.log('dodo webhook', { type, userId, paymentId, status });

    await supabase.from('payments').insert({
      user_id: userId,
      provider: 'dodo',
      provider_payment_id: paymentId,
      provider_event_id: headers['webhook-id'],
      status,
      amount_cents: data?.total_amount || 1000,
      currency: data?.currency || 'USD',
      raw: payload,
    });

    const succeeded = ['succeeded', 'completed', 'paid'].includes(String(status).toLowerCase()) ||
      String(type).toLowerCase().includes('succeeded') || String(type).toLowerCase().includes('completed');

    if (succeeded && userId) {
      await supabase.from('profiles').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', userId);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('webhook handler error', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
