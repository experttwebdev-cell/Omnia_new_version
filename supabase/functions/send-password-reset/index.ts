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
    const { email } = await req.json();

    if (!email) {
      throw new Error("Missing required parameter: email");
    }

    console.log(`🔐 Password reset requested for: ${email}`);

    // Check if user exists
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, email, full_name, company_name")
      .eq("email", email)
      .maybeSingle();

    if (sellerError) {
      console.error("Error finding user:", sellerError);
      throw new Error("Error finding user account");
    }

    // Always return success even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (!seller) {
      console.log(`⚠️ User not found for email: ${email}, but returning success for security`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists, password reset email has been sent",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store token in database
    const { error: tokenError } = await supabase
      .from("verification_tokens")
      .insert({
        user_id: seller.id,
        token: resetToken,
        token_type: "password_reset",
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      throw new Error("Error creating reset token");
    }

    // Create password reset link
    const resetLink = `${APP_URL}/#/reset-password?token=${resetToken}`;

    console.log(`🔗 Reset link generated: ${resetLink.substring(0, 50)}...`);

    // Create SMTP client
    const client = new SMTPClient(SMTP_CONFIG);

    // Prepare HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe</title>
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
                🔐 Réinitialisation de mot de passe
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour ${seller.full_name || seller.company_name || ""},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>OmnIA</strong>.
              </p>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      🔑 Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                Ou copiez-collez ce lien dans votre navigateur:
              </p>

              <p style="margin: 0 0 30px; padding: 15px; background-color: #f7f8fa; border-radius: 8px; word-break: break-all;">
                <a href="${resetLink}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                  ${resetLink}
                </a>
              </p>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff5f5 0%, #fee 100%); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #991b1b; font-size: 16px; font-weight: 600;">
                      ⚠️ Important
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #991b1b; font-size: 14px; line-height: 1.8;">
                      <li>Ce lien expire dans <strong>1 heure</strong></li>
                      <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                      <li>Votre mot de passe actuel reste valide jusqu'à ce que vous en créiez un nouveau</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Besoin d'aide?</strong><br>
                Notre équipe est là pour vous. Contactez-nous à <a href="mailto:${FROM_EMAIL}" style="color: #667eea; text-decoration: none;">${FROM_EMAIL}</a>
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
                Pour des raisons de sécurité, ce lien expirera dans 1 heure.
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
Réinitialisation de mot de passe - OmnIA

Bonjour ${seller.full_name || seller.company_name || ""},

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte OmnIA.

Pour créer un nouveau mot de passe, cliquez sur ce lien:
${resetLink}

IMPORTANT:
- Ce lien expire dans 1 heure
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Votre mot de passe actuel reste valide jusqu'à ce que vous en créiez un nouveau

Besoin d'aide?
Contactez-nous à ${FROM_EMAIL}

Cordialement,
L'équipe OmnIA

---
Cet email a été envoyé par OmnIA
Pour des raisons de sécurité, ce lien expirera dans 1 heure.
© 2025 OmnIA. Tous droits réservés.
`;

    // Send email
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: "🔐 Réinitialisation de votre mot de passe - OmnIA",
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    console.log(`✅ Password reset email sent successfully to: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Error sending password reset email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send password reset email",
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
