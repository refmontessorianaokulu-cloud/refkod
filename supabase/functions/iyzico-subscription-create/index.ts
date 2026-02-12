import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Iyzipay from "npm:iyzipay";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const iyzipay = new Iyzipay({
      apiKey: Deno.env.get("IYZICO_API_KEY") || "",
      secretKey: Deno.env.get("IYZICO_SECRET_KEY") || "",
      uri: Deno.env.get("IYZICO_BASE_URL") || "https://sandbox-api.iyzipay.com",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const body = await req.json();
    const {
      userId,
      subscriptionPlanId,
      buyer,
      shippingAddress,
      billingAddress,
      cardDetails,
      callbackUrl,
    } = body;

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", subscriptionPlanId)
      .single();

    if (planError || !plan) {
      throw new Error("Abonelik planı bulunamadı");
    }

    const conversationId = `sub-${userId}-${Date.now()}`;
    const orderId = `order-${conversationId}`;

    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: plan.price.toString(),
      paidPrice: plan.price.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: 1,
      basketId: orderId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
      paymentCard: {
        cardHolderName: cardDetails.cardHolderName,
        cardNumber: cardDetails.cardNumber,
        expireMonth: cardDetails.expireMonth,
        expireYear: cardDetails.expireYear,
        cvc: cardDetails.cvc,
        registerCard: 1,
      },
      buyer: {
        id: buyer.id,
        name: buyer.name,
        surname: buyer.surname,
        gsmNumber: buyer.phone,
        email: buyer.email,
        identityNumber: buyer.identityNumber || "11111111111",
        registrationAddress: buyer.address || shippingAddress.address,
        ip: buyer.ip || "85.34.78.112",
        city: buyer.city || shippingAddress.city,
        country: buyer.country || "Turkey",
      },
      shippingAddress: {
        contactName: shippingAddress.contactName,
        city: shippingAddress.city,
        country: shippingAddress.country || "Turkey",
        address: shippingAddress.address,
      },
      billingAddress: {
        contactName: billingAddress.contactName,
        city: billingAddress.city,
        country: billingAddress.country || "Turkey",
        address: billingAddress.address,
      },
      basketItems: [
        {
          id: subscriptionPlanId,
          name: plan.name,
          category1: plan.plan_type === "course" ? "Online Kurs" : "Oyun Grubu",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: plan.price.toString(),
        },
      ],
      callbackUrl: callbackUrl,
    };

    const result: any = await new Promise((resolve, reject) => {
      iyzipay.threedsInitialize.create(paymentRequest, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (result.status === "success") {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await supabase.from("user_subscriptions").insert({
        user_id: userId,
        subscription_plan_id: subscriptionPlanId,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
        auto_renew: true,
        failed_payment_count: 0,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Abonelik oluşturulamadı",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
