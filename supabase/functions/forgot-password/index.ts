// supabase/functions/forgot-password/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, reset_token, user_name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create SMTP client avec la bonne configuration
    const client = new SMTPClient({
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

    const resetLink = `${Deno.env.get("SITE_URL") || 'https://omnia.sale'}/reset-password?token=${reset_token}&email=${encodeURIComponent(email)}`;

    // Contenu HTML de l'email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f9fafb;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 40px 30px; 
            text-align: center; 
            color: white; 
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 14px;
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
        }
        .button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 10px; 
            font-weight: bold; 
            font-size: 16px;
            margin: 25px 0;
            text-align: center;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        .security-note {
            background: #e8f4fd;
            border: 1px solid #b6e0fe;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Omnia AI</div>
            <div class="tagline">E-commerce intelligent</div>
        </div>
        <div class="content">
            <h2 style="color: #2d3748; margin-bottom: 10px;">Réinitialisation de mot de passe</h2>
            
            <p>Bonjour ${user_name || 'Utilisateur'},</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Omnia AI.</p>
            
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">
                    Réinitialiser mon mot de passe
                </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
            
            <div class="code-block">
                ${resetLink}
            </div>
            
            <div class="security-note">
                <strong>⚠️ Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.
                Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
            </div>
            
            <p>Si vous rencontrez des problèmes, contactez notre support à <a href="mailto:support@omnia.sale" style="color: #667eea;">support@omnia.sale</a></p>
        </div>
        <div class="footer">
            <p>© 2024 Omnia AI. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Contenu texte simple
    const textContent = `
Réinitialisation de mot de passe - Omnia AI

Bonjour ${user_name || 'Utilisateur'},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Omnia AI.

Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :
${resetLink}

Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.

Ce lien expirera dans 1 heure pour des raisons de sécurité.

Si vous rencontrez des problèmes, contactez notre support : support@omnia.sale

© 2024 Omnia AI. Tous droits réservés.
    `;

    // Envoi de l'email
    await client.send({
      from: Deno.env.get("FROM_EMAIL")!,
      to: email,
      subject: "Réinitialisation de votre mot de passe - Omnia AI",
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email de réinitialisation envoyé avec succès'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'envoi de l\'email: ' + error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});