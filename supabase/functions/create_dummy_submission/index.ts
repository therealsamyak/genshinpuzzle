export const config = {
  verifyJWT: false,
};

// supabase/functions/create_dummy_submission/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_BYTES = 1_048_576; // 1MB
const MAX_SUBMISSIONS = 1000;
const BUCKET = "submission-images";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return new Response("Expected multipart/form-data", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Expect multipart/form-data:
    // - image: PNG file
    // - team0/team1/team2/team3: character names (strings)
    // - strongestHit: number (string)
    // - totalDps: number (string)
    // - genshinUid: optional string
    const form = await req.formData();

    const file = form.get("image");
    if (!(file instanceof File)) {
      return new Response("Missing image", {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (file.type !== "image/png") {
      return new Response("Only PNG allowed", {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (file.size > MAX_BYTES) {
      return new Response("File too large", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const team0 = form.get("team0");
    const team1 = form.get("team1");
    const team2 = form.get("team2");
    const team3 = form.get("team3");

    const elementsRaw = form.get("elements");

    let elements: unknown = null;

    if (typeof elementsRaw === "string" && elementsRaw.trim().length > 0) {
      try {
        elements = JSON.parse(elementsRaw);
      } catch {
        return new Response("Invalid elements JSON", {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (
        !Array.isArray(elements) ||
        elements.length !== 4 ||
        elements.some((x) => typeof x !== "string")
      ) {
        return new Response("elements must be an array of 4 strings", {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      // If you want to require it:
      return new Response("Missing elements", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const strongestHitRaw = form.get("strongestHit");
    const totalDpsRaw = form.get("totalDps");
    const uidRaw = form.get("genshinUid");

    if (
      typeof team0 !== "string" ||
      typeof team1 !== "string" ||
      typeof team2 !== "string" ||
      typeof team3 !== "string"
    ) {
      return new Response("Missing team fields", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (typeof strongestHitRaw !== "string") {
      return new Response("Missing strongestHit", {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (typeof totalDpsRaw !== "string") {
      return new Response("Missing totalDps", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const team = [team0, team1, team2, team3].map((s) => s.trim());

    if (team.some((s) => !s)) {
      return new Response("Team fields must be non-empty", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (new Set(team).size !== 4) {
      return new Response("Team must not contain duplicates", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const strongest_hit = Number(strongestHitRaw);
    const total_dps = Number(totalDpsRaw);
    if (!Number.isFinite(strongest_hit) || strongest_hit <= 0) {
      return new Response("Invalid strongestHit", {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!Number.isFinite(total_dps) || total_dps <= 0) {
      return new Response("Invalid totalDps", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const genshin_uid = typeof uidRaw === "string" && uidRaw.trim().length > 0
      ? uidRaw.trim()
      : null;

    // SUPABASE_URL is available in the Functions runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      return new Response("Missing SUPABASE_URL", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Put your service role key in Function env vars as: SERVICE_ROLE_KEY
    // (avoid SUPABASE_* secret names)
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) {
      return new Response("Missing SERVICE_ROLE_KEY", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Enforce cap
    const { count, error: countErr } = await admin
      .from("dummy_submissions")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      return new Response("Count failed", {
        status: 500,
        headers: corsHeaders,
      });
    }
    if ((count ?? 0) >= MAX_SUBMISSIONS) {
      return new Response("Submissions are closed", {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Insert row first to get ID
    const { data: inserted, error: insertErr } = await admin
      .from("dummy_submissions")
      .insert({
        image_path: "pending",
        team,
        strongest_hit,
        total_dps,
        genshin_uid,
        elements,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return new Response(
        JSON.stringify({
          message: "Insert failed",
          error: insertErr,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const submissionId = String(inserted.id);
    const path = `${submissionId}.png`;

    const arrayBuf = await file.arrayBuffer();
    const { error: uploadErr } = await admin.storage.from(BUCKET).upload(
      path,
      arrayBuf,
      {
        contentType: "image/png",
        upsert: false,
      },
    );

    if (uploadErr) {
      await admin.from("dummy_submissions").delete().eq("id", submissionId);
      return new Response("Upload failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { error: updateErr } = await admin
      .from("dummy_submissions")
      .update({ image_path: path })
      .eq("id", submissionId);

    if (updateErr) {
      return new Response("Update failed", {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ submissionId }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`Server error: ${String(e)}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
