// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/create_dummy_submission/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_BYTES = 1_048_576; // 1MB
const MAX_SUBMISSIONS = 1000;
const BUCKET = "submission-images";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Expect multipart/form-data:
    // - file: PNG
    // - team: JSON string array of 4 character names
    // - strongest_hit: number
    // - total_dps: number
    // - genshin_uid: optional string
    const form = await req.formData();

    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response("Missing file", { status: 400 });
    }
    if (file.type !== "image/png") {
      return new Response("Only PNG allowed", { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return new Response("File too large", { status: 400 });
    }

    const teamRaw = form.get("team");
    const strongestHitRaw = form.get("strongest_hit");
    const totalDpsRaw = form.get("total_dps");
    const uidRaw = form.get("genshin_uid");

    if (typeof teamRaw !== "string") {
      return new Response("Missing team", { status: 400 });
    }
    if (typeof strongestHitRaw !== "string") {
      return new Response("Missing strongest_hit", { status: 400 });
    }
    if (typeof totalDpsRaw !== "string") {
      return new Response("Missing total_dps", { status: 400 });
    }

    const team = JSON.parse(teamRaw);
    if (
      !Array.isArray(team) || team.length !== 4 ||
      team.some((x) => typeof x !== "string")
    ) {
      return new Response("Team must be an array of 4 names", { status: 400 });
    }
    // Prevent duplicates
    if (new Set(team).size !== 4) {
      return new Response("Team must not contain duplicates", { status: 400 });
    }

    const strongest_hit = Number(strongestHitRaw);
    const total_dps = Number(totalDpsRaw);
    if (!Number.isFinite(strongest_hit) || strongest_hit <= 0) {
      return new Response("Invalid strongest_hit", { status: 400 });
    }
    if (!Number.isFinite(total_dps) || total_dps <= 0) {
      return new Response("Invalid total_dps", { status: 400 });
    }

    const genshin_uid = typeof uidRaw === "string" && uidRaw.trim().length > 0
      ? uidRaw.trim()
      : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Enforce cap
    const { count, error: countErr } = await admin
      .from("dummy_submissions")
      .select("id", { count: "exact", head: true });

    if (countErr) return new Response("Count failed", { status: 500 });
    if ((count ?? 0) >= MAX_SUBMISSIONS) {
      return new Response("Submissions are closed", { status: 403 });
    }

    // Create a submission row first to get an ID
    const elements = team.map((name) => {
      // Client doesn't send elements; infer later in frontend if you want.
      // For now, store empty and fill client-side, or infer server-side if you ship CHARACTER_DATA.
      return null;
    });

    const { data: inserted, error: insertErr } = await admin
      .from("dummy_submissions")
      .insert({
        image_path: "pending",
        team,
        strongest_hit,
        total_dps,
        elements, // placeholder
        genshin_uid,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return new Response("Insert failed", { status: 500 });
    }

    const submissionId = inserted.id as string;
    const path = `${submissionId}.png`;

    const arrayBuf = await file.arrayBuffer();
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, arrayBuf, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadErr) {
      // Clean up row if upload failed
      await admin.from("dummy_submissions").delete().eq("id", submissionId);
      return new Response("Upload failed", { status: 500 });
    }

    const { error: updateErr } = await admin
      .from("dummy_submissions")
      .update({ image_path: path, elements: [] })
      .eq("id", submissionId);

    if (updateErr) {
      return new Response("Update failed", { status: 500 });
    }

    return new Response(JSON.stringify({ submissionId }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`Server error: ${String(e)}`, { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create_dummy_submission' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
