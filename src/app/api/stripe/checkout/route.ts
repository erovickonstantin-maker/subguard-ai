import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PLANS, type StripePlanKey } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    const { plan } = (await request.json()) as { plan: StripePlanKey };
    const planConfig = STRIPE_PLANS[plan];

    if (!planConfig || !planConfig.priceId) {
      return NextResponse.json({ error: "Ungültiger Plan." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: company } = await supabase
      .from("companies")
      .select("id, stripe_customer_id")
      .eq("owner_id", user.id)
      .single();

    let customerId = company?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      if (company) {
        await supabase
          .from("companies")
          .update({ stripe_customer_id: customerId })
          .eq("id", company.id);
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("stripe checkout error:", error);
    return NextResponse.json(
      { error: "Checkout-Session konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}
