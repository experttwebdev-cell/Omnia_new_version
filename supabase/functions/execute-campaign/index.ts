import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Campaign {
  id: string;
  store_id: string;
  topic_niche: string;
  target_audience: string;
  word_count_min: number;
  word_count_max: number;
  writing_style: string;
  tone: string;
  keywords: string[];
  content_structure: string;
  internal_linking_enabled: boolean;
  max_internal_links: number;
  image_integration_enabled: boolean;
  product_links_enabled: boolean;
  seo_optimization_enabled: boolean;
  auto_publish: boolean;
  language: string;
  frequency: string;
}

function buildPrompt(campaign: Campaign, languageName: string): string {
  const tableOfContentsExample = `<div class="table-of-contents"><h2>Table des Matieres</h2><ul><li><a href="#section-1">Titre Section 1</a></li></ul></div>`;

  return `Vous etes un expert en redaction SEO et specialiste de ${campaign.topic_niche}.

OBJECTIF : Generer un article HTML complet, structure, et SEO-friendly.

INFORMATIONS DE BASE:
- Sujet principal: ${campaign.topic_niche}
- Public cible: ${campaign.target_audience || "Audience generale interessee par " + campaign.topic_niche}
- Style d'ecriture: ${campaign.writing_style}
- Ton: ${campaign.tone}
- Langue: ${languageName}
- Nombre de mots: ${campaign.word_count_min}-${campaign.word_count_max} mots
- Mots-cles principaux: ${campaign.keywords.join(", ")}
${campaign.content_structure ? `- Structure demandee: ${campaign.content_structure}` : ""}

STRUCTURE HTML ATTENDUE:

1. Introduction engageante dans un paragraphe <p>
2. Table des matieres interactive (exemple: ${tableOfContentsExample})
3. Sections principales avec <h2 id="...">
4. Sous-sections avec <h3> et <h4>
5. Contenu riche avec listes <ul> et <ol>
6. Images avec attributs ALT optimises
7. Conclusion inspirante avec appel a l'action
8. Hashtags en fin d'article

SECTIONS RECOMMANDEES:
- Introduction
- Tendances Actuelles
- Guide de Selection / Comment Choisir
- Erreurs a Eviter
- Idees et Conseils Pratiques
- Questions Frequentes (FAQ)
- Conclusion

OPTIMISATION SEO:
- Integrez naturellement TOUS les mots-cles (3-5 fois chacun)
- Utilisez des synonymes et expressions associees
- Creez une meta description captivante de 150-160 caracteres
- Ajoutez 3-5 images avec ALT descriptifs
- Structure claire pour le referencement

TONALITE & STYLE:
- Langage fluide et naturel avec transitions douces
- Approche conseil expert, inspirant, oriente solutions
- Questions rhetoriques et exemples concrets
- Credibilite avec statistiques et expertise sectorielle

ELEMENTS ENRICHISSANTS:
- Listes a puces et numerotees pour la lisibilite
- <strong> pour les points importants
- <em> pour les nuances
- Citations et statistiques pour la credibilite
- Appels a l'action en fin de sections

FIN D'ARTICLE:
- Resumez les points cles en 2-3 phrases
- Proposez une action concrete au lecteur
- Ajoutez 4-6 hashtags pertinents

FORMAT DE SORTIE REQUIS - Retournez UNIQUEMENT un objet JSON valide:
{
  "title": "Titre SEO-optimise captivant (50-60 caracteres)",
  "content": "Votre contenu HTML complet ici avec table des matieres, sections, etc.",
  "meta_description": "Description SEO de 150-160 caracteres avec mot-cle principal",
  "focus_keyword": "mot-cle principal exact",
  "keywords": ["mot-cle1", "mot-cle2", "mot-cle3", "mot-cle4", "mot-cle5"]
}

CRITERES DE QUALITE:
- Contenu original et informatif
- ${campaign.word_count_min}-${campaign.word_count_max} mots minimum
- HTML propre et valide
- Mots-cles integres naturellement
- Structure claire avec table des matieres
- Lisible et engageant
- Optimise pour le referencement
- Pret a publier directement

IMPORTANT: Ecrivez ENTIEREMENT en ${languageName}. Le contenu doit etre de haute qualite, apporter une reelle valeur au lecteur, et etablir votre expertise dans le domaine.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      throw new Error("Campaign ID is required");
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("blog_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    const typedCampaign = campaign as unknown as Campaign;

    const { data: store } = await supabase
      .from("shopify_stores")
      .select("openai_api_key")
      .eq("id", typedCampaign.store_id)
      .single();

    const apiKey = store?.openai_api_key || openaiApiKey;

    const languageNames: { [key: string]: string } = {
      fr: "French",
      en: "English",
      es: "Spanish",
      de: "German"
    };

    const languageName = languageNames[typedCampaign.language] || "English";
    const prompt = buildPrompt(typedCampaign, languageName);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert SEO content writer who creates high-quality, engaging blog articles. You write in ${languageName}. Always return valid JSON with properly formatted HTML content that uses semantic tags and proper heading hierarchy including an interactive table of contents.`
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const articleData = JSON.parse(content);

    const { data: newArticle, error: insertError } = await supabase
      .from("blog_articles")
      .insert({
        store_id: typedCampaign.store_id,
        campaign_id: campaign_id,
        title: articleData.title,
        content: articleData.content,
        meta_description: articleData.meta_description,
        focus_keyword: articleData.focus_keyword,
        keywords: articleData.keywords,
        status: "draft",
        language: typedCampaign.language,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const now = new Date();
    let nextExecution = new Date(now);

    switch (typedCampaign.frequency) {
      case "daily":
        nextExecution.setDate(nextExecution.getDate() + 1);
        break;
      case "weekly":
        nextExecution.setDate(nextExecution.getDate() + 7);
        break;
      case "bi-weekly":
        nextExecution.setDate(nextExecution.getDate() + 14);
        break;
      case "monthly":
        nextExecution.setMonth(nextExecution.getMonth() + 1);
        break;
    }

    await supabase
      .from("blog_campaigns")
      .update({
        articles_generated: (campaign.articles_generated || 0) + 1,
        last_execution: now.toISOString(),
        next_execution: nextExecution.toISOString(),
      })
      .eq("id", campaign_id);

    await supabase
      .from("campaign_execution_log")
      .insert({
        campaign_id: campaign_id,
        execution_time: now.toISOString(),
        status: "success",
        articles_generated: 1,
      });

    return new Response(
      JSON.stringify({
        success: true,
        article: newArticle,
        message: "Article generated successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error executing campaign:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
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
