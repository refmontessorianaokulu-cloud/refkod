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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans(*),
        profiles(*)
      `)
      .eq("status", "active")
      .eq("auto_renew", true)
      .lte("next_billing_date", today.toISOString())
      .not("iyzico_card_token", "is", null);

    if (subsError) {
      throw new Error(`Abonelikler alınamadı: ${subsError.message}`);
    }

    const results = [];

    for (const subscription of subscriptions || []) {
      try {
        const conversationId = `recurring-${subscription.id}-${Date.now()}`;

        const { data: card } = await supabase
          .from("payment_cards")
          .select("*")
          .eq("card_token", subscription.iyzico_card_token)
          .single();

        if (!card) {
          throw new Error("Kart bilgisi bulunamadı");
        }

        const paymentRequest = {
          locale: Iyzipay.LOCALE.TR,
          conversationId: conversationId,
          price: subscription.subscription_plans.price.toString(),
          paidPrice: subscription.subscription_plans.price.toString(),
          currency: Iyzipay.CURRENCY.TRY,
          installment: 1,
          paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
          paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
          paymentCard: {
            cardToken: subscription.iyzico_card_token,
            cardUserKey: subscription.user_id,
          },
          buyer: {
            id: subscription.profiles.id,
            name: subscription.profiles.full_name?.split(" ")[0] || "User",
            surname: subscription.profiles.full_name?.split(" ")[1] || "User",
            email: subscription.profiles.email,
            identityNumber: "11111111111",
            registrationAddress: "Adres",
            city: "Istanbul",
            country: "Turkey",
            ip: "85.34.78.112",
          },
          shippingAddress: {
            contactName: subscription.profiles.full_name || "User",
            city: "Istanbul",
            country: "Turkey",
            address: "Adres",
          },
          billingAddress: {
            contactName: subscription.profiles.full_name || "User",
            city: "Istanbul",
            country: "Turkey",
            address: "Adres",
          },
          basketItems: [
            {
              id: subscription.subscription_plan_id,
              name: subscription.subscription_plans.name,
              category1: subscription.subscription_plans.plan_type,
              itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
              price: subscription.subscription_plans.price.toString(),
            },
          ],
        };

        const result: any = await new Promise((resolve, reject) => {
          iyzipay.payment.create(paymentRequest, (err: any, result: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });

        if (result.status === "success") {
          const { data: payment } = await supabase.from("payments").insert({
            order_id: null,
            payment_method: "credit_card",
            payment_status: "completed",
            amount: parseFloat(result.paidPrice),
            transaction_id: result.paymentId,
            iyzico_payment_id: result.paymentId,
            iyzico_conversation_id: result.conversationId,
            installment_count: 1,
            payment_type: "recurring",
            payment_date: new Date().toISOString(),
          }).select().single();

          const nextBillingDate = new Date();
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          await supabase
            .from("user_subscriptions")
            .update({
              next_billing_date: nextBillingDate.toISOString(),
              failed_payment_count: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          await supabase.from("recurring_payment_logs").insert({
            subscription_id: subscription.id,
            payment_id: payment?.id,
            attempt_date: new Date().toISOString(),
            status: "success",
            amount: parseFloat(result.paidPrice),
            iyzico_payment_id: result.paymentId,
          });

          results.push({
            subscriptionId: subscription.id,
            success: true,
            message: "Ödeme başarılı",
          });
        } else {
          throw new Error(result.errorMessage || "Ödeme başarısız");
        }
      } catch (error) {
        const failedCount = subscription.failed_payment_count + 1;
        const newStatus = failedCount >= 3 ? "suspended" : "active";

        await supabase
          .from("user_subscriptions")
          .update({
            failed_payment_count: failedCount,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        await supabase.from("recurring_payment_logs").insert({
          subscription_id: subscription.id,
          attempt_date: new Date().toISOString(),
          status: "failed",
          amount: subscription.subscription_plans.price,
          error_message: error.message,
        });

        results.push({
          subscriptionId: subscription.id,
          success: false,
          message: error.message,
          failedCount: failedCount,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: subscriptions?.length || 0,
        results: results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Recurring payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Düzenli ödeme işlemi başarısız",
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
