import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { SMTPClient } from "npm:denomailer@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Configuration SMTP depuis les variables d'environnement
const SMTP_CONFIG = {
  connection: {
    hostname: Deno.env.get("SMTP_HOST") || "ohio.o2switch.net",
    port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
    tls: Deno.env.get("SMTP_SECURE") === "true",
    auth: {
      username: Deno.env.get("SMTP_USER") || "support@omnia.sale",
      password: Deno.env.get("SMTP_PASSWORD") || "",
    },
  },
};

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "support@omnia.sale";
const FROM_NAME = Deno.env.get("FROM_NAME") || "OmnIA Support";
const APP_URL = Deno.env.get("APP_URL") || "https://omnia.sale";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { email, userId, verificationToken, userName, companyName } = await req.json();

    if (!email || !userId || !verificationToken) {
      throw new Error("Missing required parameters: email, userId, verificationToken");
    }

    console.log(`📧 Sending verification email to: ${email}`);

    // Create verification link
    const verificationLink = `${APP_URL}/#/verify-email?token=${verificationToken}&userId=${userId}`;

    // Create SMTP client
    const client = new SMTPClient(SMTP_CONFIG);

    // Prepare HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre adresse email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f8fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f8fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Bienvenue sur OmnIA!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour ${userName || companyName || ""},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Merci de vous être inscrit sur <strong>OmnIA</strong>, votre plateforme d'optimisation e-commerce propulsée par l'intelligence artificielle!
              </p>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Pour commencer à utiliser toutes les fonctionnalités de votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      ✅ Confirmer mon email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                Ou copiez-collez ce lien dans votre navigateur:
              </p>

              <p style="margin: 0 0 30px; padding: 15px; background-color: #f7f8fa; border-radius: 8px; word-break: break-all;">
                <a href="${verificationLink}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                  ${verificationLink}
                </a>
              </p>

              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 20px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">
                      🚀 Vos avantages OmnIA:
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                      <li>Optimisation SEO automatique de vos produits</li>
                      <li>Génération de contenu intelligent</li>
                      <li>Analytics et insights avancés</li>
                      <li>Support prioritaire 7j/7</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Besoin d'aide?</strong><br>
                Notre équipe est là pour vous accompagner. Contactez-nous à <a href="mailto:${FROM_EMAIL}" style="color: #667eea; text-decoration: none;">${FROM_EMAIL}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7f8fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                Cet email a été envoyé par <strong>OmnIA</strong>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
              </p>
              <p style="margin: 15px 0 0; color: #999999; font-size: 12px;">
                © 2025 OmnIA. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Plain text version (fallback)
    const textContent = `
Bienvenue sur OmnIA!

Bonjour ${userName || companyName || ""},

Merci de vous être inscrit sur OmnIA, votre plateforme d'optimisation e-commerce propulsée par l'intelligence artificielle!

Pour commencer à utiliser toutes les fonctionnalités de votre compte, veuillez confirmer votre adresse email en cliquant sur ce lien:

${verificationLink}

Vos avantages OmnIA:
- Optimisation SEO automatique de vos produits
- Génération de contenu intelligent
- Analytics et insights avancés
- Support prioritaire 7j/7

Besoin d'aide?
Contactez-nous à ${FROM_EMAIL}

Cordialement,
L'équipe OmnIA

---
Cet email a été envoyé par OmnIA
Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
© 2025 OmnIA. Tous droits réservés.
`;

    // Send email
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: "✨ Confirmez votre adresse email - OmnIA",
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    console.log(`✅ Verification email sent successfully to: ${email}`);

    // Update seller record to track verification email sent
    await supabase
      .from("sellers")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification email sent successfully",
        email: email,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Error sending verification email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send verification email",
        details: error.toString(),
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
