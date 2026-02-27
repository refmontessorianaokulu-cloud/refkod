import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WhatsAppPayload {
  phoneNumber: string;
  parentName: string;
  childName: string;
  theme: string;
  sessionDate: string;
  sessionTime: string;
  paymentLink: string;
}

async function sendWhatsAppMessage(payload: WhatsAppPayload): Promise<{ success: boolean; error?: string }> {
  const whatsappApiToken = Deno.env.get("WHATSAPP_API_TOKEN");
  const whatsappPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!whatsappApiToken || !whatsappPhoneNumberId) {
    console.error("WhatsApp API credentials not configured");
    return { success: false, error: "WhatsApp API credentials not configured" };
  }

  let formattedPhone = payload.phoneNumber.replace(/\D/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "90" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("90")) {
    formattedPhone = "90" + formattedPhone;
  }

  const message = `Merhaba ${payload.parentName}, ${payload.childName} için ${payload.theme}'lı oyun grubu rezervasyonunuz onaylanmıştır.\n\nTarih: ${payload.sessionDate}\nSaat: ${payload.sessionTime}\n\nÖdeme Linki: ${payload.paymentLink}\n\nRef Çocuk Akademisi`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return { success: false, error: JSON.stringify(data) };
    }

    console.log("WhatsApp message sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: WhatsAppPayload = await req.json();

    if (!payload.phoneNumber || !payload.parentName || !payload.paymentLink) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await sendWhatsAppMessage(payload);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
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
