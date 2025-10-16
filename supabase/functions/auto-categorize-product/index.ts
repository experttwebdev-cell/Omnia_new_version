import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CategorizeRequest {
  productId?: string;
  title?: string;
  description?: string;
}

interface CategorizeResponse {
  success: boolean;
  google_product_category?: string;
  error?: string;
}

async function callDeepSeek(title: string, description: string): Promise<string> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  console.log('📞 Calling DeepSeek API for categorization...');
  console.log('📦 Product title:', title);

  const cleanDescription = description
    ? description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500)
    : 'Aucune description';

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert e-commerce en taxonomie produit Google Shopping.

Ta mission : à partir du titre et de la description d'un produit, déduis la catégorie Google Product Category la plus précise possible, en français.

RÈGLES STRICTES:
1. Utilise EXACTEMENT la hiérarchie Google Shopping officielle
2. Sépare les niveaux avec " > "
3. Donne UNIQUEMENT la chaîne de catégorie, sans commentaire ni phrase
4. Sois aussi PRÉCIS que possible (va jusqu'au dernier niveau si possible)
5. Utilise le français pour toutes les catégories

EXEMPLES DE CATÉGORIES VALIDES:
- "Meubles > Mobilier de salon > Canapés > Canapés d'angle"
- "Meubles > Armoires et meubles de rangement > Casiers et armoires de rangement"
- "Meubles > Tables > Tables basses"
- "Meubles > Chaises > Chaises de salle à manger"
- "Maison et jardin > Éclairage > Lampes de table"
- "Meubles > Lits et accessoires > Cadres de lit"
- "Meubles > Buffets et bahuts"
- "Meubles > Mobilier de bureau > Bureaux"
- "Meubles > Étagères et bibliothèques"
- "Meubles > Tables > Tables à manger"
- "Meubles > Fauteuils"
- "Meubles > Mobilier de jardin > Tables de jardin"
- "Meubles > Mobilier de jardin > Chaises de jardin"
- "Maison et jardin > Décoration > Miroirs"
- "Maison et jardin > Décoration > Tapis"

Ne donne QUE la catégorie, rien d'autre.`,
        },
        {
          role: 'user',
          content: `Titre : ${title}\nDescription : ${cleanDescription}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const category = data.choices[0].message.content.trim();

  // Nettoyer la réponse (enlever les guillemets, etc.)
  const cleanedCategory = category
    .replace(/^"|"$/g, '') // Enlever guillemets début/fin
    .replace(/^'|'$/g, '')   // Enlever apostrophes début/fin
    .replace(/^Catégorie:\s*/i, '') // Enlever "Catégorie: "
    .replace(/^Réponse:\s*/i, '') // Enlever "Réponse: "
    .trim();

  console.log('✅ Category detected:', cleanedCategory);
  return cleanedCategory;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log('🏷️ === AUTO-CATEGORIZE PRODUCT ==="');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase configuration missing',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestBody: CategorizeRequest = await req.json();
    const { productId, title, description } = requestBody;

    let productTitle = title;
    let productDescription = description;

    // Si productId fourni, récupérer les données depuis la DB
    if (productId) {
      console.log('📦 Fetching product from database:', productId);
      const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

      const { data, error } = await supabaseClient
        .from('shopify_products')
        .select('title, description')
        .eq('id', productId)
        .maybeSingle();

      if (error || !data) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Product not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      productTitle = data.title;
      productDescription = data.description || '';
    }

    if (!productTitle) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product title is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Appeler DeepSeek pour catégoriser
    const googleProductCategory = await callDeepSeek(
      productTitle,
      productDescription || ''
    );

    // Si productId fourni, mettre à jour la DB
    if (productId) {
      console.log('💾 Updating product category in database...');
      const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

      const { error: updateError } = await supabaseClient
        .from('shopify_products')
        .update({
          google_product_category: googleProductCategory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to update product category',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('✅ Product category updated successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        google_product_category: googleProductCategory,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Error in auto-categorize:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});