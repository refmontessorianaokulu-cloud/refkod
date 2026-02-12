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

    const body = await req.json();
    const {
      orderId,
      orderItems,
      buyer,
      shippingAddress,
      billingAddress,
      price,
      paidPrice,
      installment = 1,
      cardDetails,
      conversationId,
      callbackUrl,
    } = body;

    const basketItems = orderItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      category1: item.category || "General",
      itemType: item.itemType || Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
      price: item.price.toString(),
    }));

    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId || orderId,
      price: price.toString(),
      paidPrice: paidPrice.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: installment,
      basketId: orderId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardHolderName: cardDetails.cardHolderName,
        cardNumber: cardDetails.cardNumber,
        expireMonth: cardDetails.expireMonth,
        expireYear: cardDetails.expireYear,
        cvc: cardDetails.cvc,
        registerCard: cardDetails.registerCard || 0,
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
      basketItems: basketItems,
      callbackUrl: callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
    };

    const result = await new Promise((resolve, reject) => {
      iyzipay.threedsInitialize.create(paymentRequest, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Iyzico checkout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Payment initialization failed",
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
