const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://a-1enterprises.co.in";

function getCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  var origin = req.headers.get("origin") || ALLOWED_ORIGIN;
  var corsHeaders = getCorsHeaders(origin);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Look up owner details
    var ownerName = "\u2014", ownerPhone = "\u2014", ownerWhatsApp = "\u2014", ownerEmail = "\u2014", ownerLocation = "\u2014";
    try {
      if (supabaseUrl && supabaseKey && record.owner_id) {
        const ownerRes = await fetch(supabaseUrl + "/rest/v1/owners?id=eq." + record.owner_id + "&select=full_name,phone,whatsapp_number,email,location", {
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
            if (o.location) ownerLocation = o.location;
          }
        }
      }
    } catch (_) { /* owner lookup failed non-fatally */ }

    // Look up dog details
    var dogName = "\u2014", dogBreed = "\u2014", dogAge = "\u2014", dogGender = "\u2014", dogSickness = "\u2014", dogVaccination = "\u2014", dogDeworming = "\u2014", dogAllergy = "\u2014", dogTemperament = "\u2014", dogBehavioral = "\u2014";
    try {
      if (supabaseUrl && supabaseKey && record.dog_id) {
        const dogRes = await fetch(supabaseUrl + "/rest/v1/dogs?id=eq." + record.dog_id + "&select=name,breed,age,gender,sickness,vaccination,deworming_3_months,allergy,temperament,behavioral_issues", {
          headers: { "apikey": supabaseKey, "Authorization": "Bearer " + supabaseKey },
        });
        if (dogRes.ok) {
          var dogs = await dogRes.json();
          if (dogs && dogs.length > 0) {
            var d = dogs[0];
            if (d.name) dogName = d.name;
            if (d.breed) dogBreed = d.breed;
            if (d.age) dogAge = d.age;
            if (d.gender) dogGender = d.gender;
            if (d.sickness) dogSickness = d.sickness;
            if (d.vaccination) dogVaccination = d.vaccination;
            if (d.deworming_3_months) dogDeworming = d.deworming_3_months;
            if (d.allergy) dogAllergy = d.allergy;
            if (d.temperament) dogTemperament = d.temperament;
            if (d.behavioral_issues) dogBehavioral = d.behavioral_issues;
          }
        }
      }
    } catch (e) { console.error("[send-booking-email] Dog lookup failed:", e); }

    var dateStr = record.start_date || "";
    if (record.time_slot) dateStr += " (" + record.time_slot + ")";
    if (record.end_date) dateStr += (dateStr ? " to " : "") + record.end_date;

    var notesHtml = record.notes ? '<tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Notes</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">' + escapeHtml(record.notes) + '</td></tr>' : '';

    var dogSection = (record.dog_id) ? `
            <h3 style="margin:20px 0 10px;font-size:0.95rem;color:#1A1412;border-bottom:2px solid #C9A05C;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.3px">Dog Details</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:24px">
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Name</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogName)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Breed</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogBreed)}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Age</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogAge)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Gender</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogGender)}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Sickness</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogSickness)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Vaccination</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogVaccination)}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Deworming</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogDeworming)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Allergies</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogAllergy)}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Temperament</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogTemperament)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Behavioral Issues</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dogBehavioral)}</td></tr>
            </table>` : '';

    var vacSection = (record.vaccination_card_data && record.vaccination_card_name) ? `
            <h3 style="margin:20px 0 10px;font-size:0.95rem;color:#1A1412;border-bottom:2px solid #C9A05C;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.3px">Vaccination Card</h3>
            <p style="margin:0 0 24px;font-size:0.85rem;color:#7A6B5E">Attached: ${escapeHtml(record.vaccination_card_name)}</p>` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media only screen and (max-width:480px) {
            body { padding: 12px 6px !important; }
            .container { padding: 0 !important; }
            .inner { padding: 20px 14px !important; }
            td { display: block !important; width: auto !important; padding: 4px 0 !important; }
            td:first-child { padding-top: 8px !important; }
            td:last-child { padding-bottom: 8px !important; border-bottom: 1px solid #eee; }
          }
        </style>
      </head>
      <body style="font-family:Arial,Helvetica,sans-serif;background:#f0ece6;margin:0;padding:24px 12px">
        <div class="container" style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
          <div style="background:#1A1412;padding:28px 24px;text-align:center">
            <h1 style="color:#C9A05C;margin:0 0 4px;font-size:1.4rem;font-weight:700;letter-spacing:0.5px">A-1 Enterprises</h1>
            <p style="color:#fff;margin:0;font-size:0.85rem;opacity:0.75">New Booking &mdash; ${escapeHtml(record.service_category || "")} Received</p>
          </div>
          <div class="inner" style="padding:28px 24px;font-size:0.9rem;line-height:1.6;color:#2b2b2b">

            <h3 style="margin:0 0 10px;font-size:0.95rem;color:#1A1412;border-bottom:2px solid #C9A05C;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.3px">Booking Details</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:24px">
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Category</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(record.service_category || "\u2014")}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Service</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(record.service_specific || "\u2014")}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Date / Time</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(dateStr || "\u2014")}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Preferred Contact</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(record.contact_method || "\u2014")}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Pick-up &amp; Drop</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${record.pickup_required ? "\u2705 Yes" : "No"}${record.pickup_address ? "<br><span style=\"color:#7A6B5E;font-weight:400\">" + escapeHtml(record.pickup_address) + "</span>" : ""}</td></tr>
              ${notesHtml}
            </table>

            <h3 style="margin:20px 0 10px;font-size:0.95rem;color:#1A1412;border-bottom:2px solid #C9A05C;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.3px">Customer Details</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:24px">
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Name</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(ownerName)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Phone</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(ownerPhone)}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">WhatsApp</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(ownerWhatsApp)}</td></tr>
              <tr><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Email</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(ownerEmail)}</td></tr>
              <tr style="background:#faf8f5"><td style="padding:8px 12px;color:#7A6B5E;width:38%;vertical-align:top">Location</td><td style="padding:8px 12px;font-weight:600;vertical-align:top">${escapeHtml(ownerLocation)}</td></tr>
            </table>

            ${dogSection}

            ${vacSection}

            <p style="margin:24px 0 0;color:#7A6B5E;font-size:0.85rem;text-align:center;border-top:1px solid #e0d8ce;padding-top:20px">
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

    const ccEmail = Deno.env.get("NOTIFICATION_CC");
    const emailBody = {
      from: Deno.env.get("RESEND_FROM_EMAIL") || "A-1 Enterprises <noreply@mail.a-1enterprises.co.in>",
      to: Deno.env.get("NOTIFICATION_EMAIL") || "a1.enterprises8891@gmail.com",
      subject: `New Booking: ${record.service_specific || "Inquiry"} \u2014 ${record.service_category || "A-1 Enterprises"}`,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
      ...(ccEmail ? { cc: ccEmail } : {}),
    };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
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
  if (text === undefined || text === null) return "";
  if (typeof text === "boolean") return text ? "Yes" : "No";
  if (typeof text !== "string") text = String(text);
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}