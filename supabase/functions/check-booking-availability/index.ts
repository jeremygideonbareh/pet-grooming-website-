const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://a1-enterprises.pages.dev";

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
    var body = await req.json();
    var { service_category, start_date, time_slot, exclude_booking_id } = body;

    if (!service_category || !start_date || !time_slot) {
      return new Response(JSON.stringify({ error: "Missing required fields: service_category, start_date, time_slot" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    var supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    var supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseKey) {
      console.error("[check-booking-availability] SUPABASE env vars not set");
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    var queryUrl = supabaseUrl + "/rest/v1/bookings?id=select&service_category=eq." + encodeURIComponent(service_category) + "&start_date=eq." + encodeURIComponent(start_date) + "&time_slot=eq." + encodeURIComponent(time_slot) + "&status=in.(pending,confirmed)&select=id,status";
    if (exclude_booking_id) {
      queryUrl += "&id=neq." + encodeURIComponent(String(exclude_booking_id));
    }

    var res = await fetch(queryUrl, {
      headers: { "apikey": supabaseKey, "Authorization": "Bearer " + supabaseKey },
    });
    if (!res.ok) {
      var errText = await res.text();
      console.error("[check-booking-availability] Supabase query failed:", res.status, errText);
      return new Response(JSON.stringify({ error: "Database query failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    var bookings = await res.json();
    return new Response(JSON.stringify({
      available: !bookings || bookings.length === 0,
      existingBooking: bookings && bookings.length > 0 ? bookings[0] : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[check-booking-availability] Error:", e.message);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
