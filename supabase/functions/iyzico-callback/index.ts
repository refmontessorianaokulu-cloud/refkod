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

    const formData = await req.formData();
    const paymentId = formData.get("paymentId") as string;
    const conversationId = formData.get("conversationData") as string;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      paymentId: paymentId,
    };

    const result: any = await new Promise((resolve, reject) => {
      iyzipay.threedsPayment.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (result.status === "success") {
      const orderId = conversationId;

      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          payment_method: "credit_card",
          payment_status: "completed",
          amount: parseFloat(result.paidPrice),
          transaction_id: result.paymentId,
          iyzico_payment_id: result.paymentId,
          iyzico_conversation_id: result.conversationId,
          installment_count: result.installment,
          payment_type: "one_time",
          payment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Payment insert error:", paymentError);
      }

      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      if (result.cardToken) {
        await supabase.from("payment_cards").upsert({
          user_id: result.buyer?.id,
          card_token: result.cardToken,
          card_alias: result.cardAlias,
          card_family: result.cardFamily,
          card_association: result.cardAssociation,
          card_bank_name: result.cardBankName || "Unknown",
          last_four_digits: result.lastFourDigits,
          is_default: false,
        });
      }

      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ödeme Başarılı</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #22c55e; font-size: 24px; margin-bottom: 20px; }
            .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="success">✓ Ödemeniz başarıyla tamamlandı!</div>
          <p>Sipariş numaranız: ${orderId}</p>
          <p>Ödeme tutarı: ${result.paidPrice} TL</p>
          <a href="/" class="button">Ana Sayfaya Dön</a>
          <script>
            setTimeout(() => { window.location.href = '/'; }, 5000);
          </script>
        </body>
        </html>
        `,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    } else {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ödeme Başarısız</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #ef4444; font-size: 24px; margin-bottom: 20px; }
            .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="error">✗ Ödeme başarısız oldu</div>
          <p>Hata: ${result.errorMessage || "Bilinmeyen hata"}</p>
          <a href="/" class="button">Tekrar Dene</a>
        </body>
        </html>
        `,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hata</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #ef4444; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="error">Bir hata oluştu</div>
        <p>${error.message}</p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }
});
