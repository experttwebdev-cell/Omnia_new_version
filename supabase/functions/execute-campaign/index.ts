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

    const prompt = `You are an expert content writer specializing in ${typedCampaign.topic_niche}.

Target Audience: ${typedCampaign.target_audience || "General audience"}
Writing Style: ${typedCampaign.writing_style}
Tone: ${typedCampaign.tone}
Keywords to include: ${typedCampaign.keywords.join(", ")}
Word Count: ${typedCampaign.word_count_min}-${typedCampaign.word_count_max} words
${typedCampaign.content_structure ? `Content Structure: ${typedCampaign.content_structure}` : ""}

Write a comprehensive, engaging blog article about ${typedCampaign.topic_niche}. The article should:
1. Have an attention-grabbing title
2. Include an engaging introduction
3. Be well-structured with clear headings
4. Naturally incorporate the target keywords
5. Provide valuable, actionable information
6. Have a compelling conclusion with a call-to-action

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Article title here",
  "content": "Full article content in HTML format",
  "meta_description": "SEO meta description (150-160 characters)",
  "focus_keyword": "Main keyword",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert blog content writer. Always return valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
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
