const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    if (!record) {
      return new Response(JSON.stringify({ error: "No record in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-booking-email] RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up owner details
    var ownerName = "—", ownerPhone = "—", ownerWhatsApp = "—", ownerEmail = "—";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (supabaseUrl && supabaseKey && record.owner_id) {
        const ownerRes = await fetch(supabaseUrl + "/rest/v1/owners?id=eq." + record.owner_id + "&select=full_name,phone,whatsapp_number,email", {
          headers: { "apikey": supabaseKey, "Authorization": "Bearer " + supabaseKey },
        });
        if (ownerRes.ok) {
          var owners = await ownerRes.json();
          if (owners && owners.length > 0) {
            var o = owners[0];
            if (o.full_name) ownerName = o.full_name;
            if (o.phone) ownerPhone = o.phone;
            if (o.whatsapp_number) ownerWhatsApp = o.whatsapp_number;
            if (o.email) ownerEmail = o.email;
          }
        }
      }
    } catch (_) { /* owner lookup failed non-fatally */ }

    var dateStr = record.start_date || "";
    if (record.time_slot) dateStr += " (" + record.time_slot + ")";
    if (record.end_date) dateStr += (dateStr ? " to " : "") + record.end_date;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:32px">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <div style="background:#1A1412;padding:24px;text-align:center">
            <h1 style="color:#C9A05C;margin:0;font-size:1.3rem">A-1 Enterprises</h1>
            <p style="color:#fff;margin:6px 0 0;font-size:0.85rem;opacity:0.8">New Booking Received</p>
          </div>
          <div style="padding:28px 24px">
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Category</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.service_category || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Service</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.service_specific || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Date / Time</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(dateStr || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Preferred Contact</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.contact_method || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Pick-up &amp; Drop</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${record.pickup_required ? "✅ Yes" : "No"}${record.pickup_address ? "<br><span style=\"font-size:0.8rem;color:#7A6B5E;font-weight:400\">" + escapeHtml(record.pickup_address) + "</span>" : ""}</td></tr>
            </table>
            <h3 style="margin:24px 0 12px;font-size:0.95rem;color:#1A1412">Customer Details</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Name</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(ownerName)}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Phone</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(ownerPhone)}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">WhatsApp</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(ownerWhatsApp)}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E">Email</td><td style="padding:10px 0;font-weight:600;text-align:right">${escapeHtml(ownerEmail)}</td></tr>
            </table>
            <p style="margin:24px 0 0;color:#7A6B5E;font-size:0.85rem;text-align:center;border-top:1px solid #eee;padding-top:20px">
              This notification was sent automatically from A-1 Enterprises.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    var attachments=[];
    if(record.vaccination_card_data && record.vaccination_card_name){
      var fileName=record.vaccination_card_name.replace(/^.*[\\\/]/,'').replace(/[<>:"|?*]/g,'_').substring(0,255);
      var fileType=record.vaccination_card_type||'application/octet-stream';
      var allowedTypes=['image/jpeg','image/png','image/webp','application/pdf'];
      if(!allowedTypes.includes(fileType)){console.warn("[send-booking-email] Vaccination card type not allowed, skipping attachment:",fileType);}else{
        var approxSize=(record.vaccination_card_data.length*0.75);
        var maxBytes=5*1024*1024;
        if(approxSize<maxBytes){
          attachments.push({filename:fileName,content:record.vaccination_card_data,content_type:fileType});
        }else{
          console.warn("[send-booking-email] Vaccination card too large, skipping attachment:",approxSize+" bytes");
        }
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "cloudlyconfusing@gmail.com",
        subject: `New Booking: ${record.service_specific || "Inquiry"} — ${record.service_category || "A-1 Enterprises"}`,
        html,
        ...(attachments.length>0?{attachments}:{}),
      }),
    });

    if (!res.ok) {
      var errData;
      try { errData = await res.json(); } catch (_) { errData = await res.text(); }
      console.error("[send-booking-email] Resend API Error:", res.status, JSON.stringify(errData));
      return new Response(JSON.stringify({ error: "Resend rejected", detail: errData }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    var data = await res.json();
    console.log("[send-booking-email] Resend Success:", JSON.stringify(data));

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-booking-email] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
