// supabase/functions/forgot-password/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const smtp = new SMTPClient({
  connection: {
    hostname: Deno.env.get("SMTP_HOST")!,
    port: Number(Deno.env.get("SMTP_PORT")!),
    tls: true,
    auth: {
      username: Deno.env.get("SMTP_USER")!,
      password: Deno.env.get("SMTP_PASSWORD")!,
    },
  },
});

serve(async (req) => {
  try {
    const { email, resetLink } = await req.json();

    await smtp.send({
      from: Deno.env.get("FROM_EMAIL")!,
      to: email,
      subject: "Réinitialisation de mot de passe - Omnia AI",
      content: "...", // texte simple
      html: `...`, // html
    });

    await smtp.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});