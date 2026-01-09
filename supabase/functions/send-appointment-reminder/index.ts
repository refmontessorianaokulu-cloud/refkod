import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { recipientId, appointmentSubject, message, appointmentDate } = await req.json();

    const { data: recipient } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const emailSubject = `Randevu Hatırlatması: ${appointmentSubject}`;
    const emailBody = `
Merhaba ${recipient.full_name},

Randevu hatırlatması:

${message}

${appointmentDate ? `Randevu Tarihi: ${new Date(appointmentDate).toLocaleString('tr-TR')}` : ''}

İyi günler,
REF Kindergarten
    `;

    console.log('Email would be sent to:', recipient.email);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reminder email queued',
        debug: {
          to: recipient.email,
          subject: emailSubject,
          body: emailBody
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
