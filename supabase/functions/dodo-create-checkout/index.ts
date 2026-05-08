import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;
    const email = userData.user.email;

    const apiKey = Deno.env.get('DODO_API_KEY')!;
    const productId = Deno.env.get('DODO_PRODUCT_ID')!;

    const origin = req.headers.get('origin') || 'https://wthrsociety.site';
    const returnUrl = `https://wthrsociety.site/feed?paid=1`;

    // Dodo Payments checkout session API
    const body = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name: email?.split('@')[0] || 'user' },
      payment_link: true,
      return_url: returnUrl,
      metadata: { user_id: userId },
      billing: { city: "NA", country: "US", state: "NA", street: "NA", zipcode: "00000" },
    };

    // Try test first (most product IDs in dev are test mode), then live
    const hosts = ['https://test.dodopayments.com', 'https://live.dodopayments.com'];
    let checkout: any = null;
    const errs: string[] = [];
    for (const host of hosts) {
      const r = await fetch(`${host}/payments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const txt = await r.text();
      console.log(`dodo ${host} -> ${r.status}: ${txt.slice(0, 300)}`);
      if (r.ok) { checkout = JSON.parse(txt); break; }
      errs.push(`${host}: ${r.status} ${txt.slice(0, 200)}`);
    }
    if (!checkout) throw new Error(errs.join(' | '));

    const url = checkout.payment_link || checkout.url || checkout.checkout_url;
    return new Response(JSON.stringify({ url, payment_id: checkout.payment_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('dodo-create-checkout error', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
