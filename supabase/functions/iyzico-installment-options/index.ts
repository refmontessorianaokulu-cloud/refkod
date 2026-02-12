import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Iyzipay from "npm:iyzipay";

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

    const { binNumber, price } = await req.json();

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `installment-${Date.now()}`,
      binNumber: binNumber,
      price: price.toString(),
    };

    const result: any = await new Promise((resolve, reject) => {
      iyzipay.installmentInfo.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (result.status === "success") {
      const installmentDetails = result.installmentDetails[0];
      const installmentPrices = installmentDetails.installmentPrices.filter(
        (option: any) => option.installmentNumber <= 9
      );

      return new Response(
        JSON.stringify({
          success: true,
          cardType: installmentDetails.cardType,
          cardAssociation: installmentDetails.cardAssociation,
          cardFamilyName: installmentDetails.cardFamilyName,
          bankName: installmentDetails.bankName,
          installmentOptions: installmentPrices.map((option: any) => ({
            installmentNumber: option.installmentNumber,
            price: option.price,
            totalPrice: option.totalPrice,
            installmentPrice: option.installmentPrice,
          })),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.errorMessage || "Taksit bilgileri alınamadı",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Installment options error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Taksit bilgileri alınamadı",
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
