import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { email, reset_token, user_name, type = 'password_reset' } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Create SMTP client
    const client = new SmtpClient();
    
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOST')!,
      port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
      username: Deno.env.get('SMTP_USER')!,
      password: Deno.env.get('SMTP_PASSWORD')!
    });

    let htmlContent = '';
    let subject = '';
    let resetLink = '';

    // Determine email type and build appropriate content
    if (type === 'password_reset') {
      resetLink = `${Deno.env.get('SITE_URL')}/reset-password?token=${reset_token}&email=${encodeURIComponent(email)}`;
      
      htmlContent = `
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
      subject = "Réinitialisation de votre mot de passe - Omnia AI";

    } else if (type === 'forgot_password') {
      resetLink = `${Deno.env.get('SITE_URL')}/reset-password?token=${reset_token}&email=${encodeURIComponent(email)}`;
      
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mot de passe oublié</title>
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
        .info-box {
            background: #f0f9ff;
            border: 1px solid #7dd3fc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
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
            <h2 style="color: #2d3748; margin-bottom: 10px;">Réinitialisation de votre mot de passe</h2>
            
            <p>Bonjour ${user_name || 'Utilisateur'},</p>
            
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Omnia AI.</p>
            
            <div class="info-box">
                <strong>🆘 Vous avez oublié votre mot de passe ?</strong>
                <p style="margin: 10px 0 0 0;">Pas de problème ! Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">
                    Créer un nouveau mot de passe
                </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
            
            <div class="code-block">
                ${resetLink}
            </div>
            
            <div class="security-note">
                <strong>🔒 Sécurité :</strong> 
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Ce lien est valable pendant 1 heure seulement</li>
                    <li>Ne partagez jamais ce lien avec personne</li>
                    <li>Si vous n'avez pas fait cette demande, ignorez cet email</li>
                </ul>
            </div>
            
            <div style="background: #fef3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>💡 Conseil de sécurité :</strong>
                <p style="margin: 5px 0 0 0;">Choisissez un mot de passe fort que vous n'utilisez pas sur d'autres sites.</p>
            </div>
            
            <p>Besoin d'aide ? Contactez notre équipe support à <a href="mailto:support@omnia.sale" style="color: #667eea;">support@omnia.sale</a></p>
        </div>
        <div class="footer">
            <p>© 2024 Omnia AI. Tous droits réservés.</p>
            <p style="font-size: 11px; color: #888;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>
      `;
      subject = "Aide pour votre mot de passe oublié - Omnia AI";

    } else {
      return new Response(JSON.stringify({
        error: 'Type d\'email non supporté. Utilisez "password_reset" ou "forgot_password"'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Send email
    await client.send({
      from: `${Deno.env.get('FROM_NAME')} <${Deno.env.get('FROM_EMAIL')}>`,
      to: email,
      subject: subject,
      html: htmlContent
    });

    await client.close();

    return new Response(JSON.stringify({
      success: true,
      message: type === 'password_reset' 
        ? 'Email de réinitialisation envoyé avec succès' 
        : 'Email d\'aide pour mot de passe oublié envoyé avec succès',
      type: type,
      email: email
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'envoi de l\'email: ' + error.message,
      type: 'smtp_error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});