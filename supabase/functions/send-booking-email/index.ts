Deno.serve(async (req) => {
  try {
    const { record } = await req.json();

    if (!record) {
      return new Response(JSON.stringify({ error: "No record in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-booking-email] RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

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
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Service</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.service || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Category</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.category || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Date / Time</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.timeframe || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Owner ID</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.owner_id || "—")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E;border-bottom:1px solid #eee">Notes</td><td style="padding:10px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${escapeHtml(record.notes || "None")}</td></tr>
              <tr><td style="padding:10px 0;color:#7A6B5E">Status</td><td style="padding:10px 0;font-weight:600;text-align:right">${escapeHtml(record.status || "pending")}</td></tr>
            </table>
            <p style="margin:24px 0 0;color:#7A6B5E;font-size:0.85rem;text-align:center;border-top:1px solid #eee;padding-top:20px">
              This notification was sent automatically from A-1 Enterprises.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "cloudlyconfusing@gmail.com",
        subject: `New Booking: ${record.service || "Inquiry"} — ${record.category || "A-1 Enterprises"}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[send-booking-email] Resend API error:", res.status, errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-booking-email] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
