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

    const languageNames: { [key: string]: string } = {
      fr: "French",
      en: "English",
      es: "Spanish",
      de: "German"
    };

    const languageName = languageNames[typedCampaign.language] || "English";

    const prompt = `You are an expert SEO content writer and ${typedCampaign.topic_niche} specialist.

## ARTICLE REQUIREMENTS

### Target Information
- Topic/Niche: ${typedCampaign.topic_niche}
- Target Audience: ${typedCampaign.target_audience || "General audience interested in " + typedCampaign.topic_niche}
- Writing Style: ${typedCampaign.writing_style}
- Tone: ${typedCampaign.tone}
- Language: ${languageName}
- Word Count: ${typedCampaign.word_count_min}-${typedCampaign.word_count_max} words
- Primary Keywords: ${typedCampaign.keywords.join(", ")}
${typedCampaign.content_structure ? `- Content Structure: ${typedCampaign.content_structure}` : ""}

### Quality Standards
Create a comprehensive, high-quality blog article that meets these standards:

1. **Title Requirements:**
   - Create an SEO-optimized, compelling title (NOT generic)
   - Include the primary keyword naturally
   - Make it click-worthy and specific
   - 50-60 characters ideal length

2. **Content Structure:**
   - Start with a strong hook in the first paragraph
   - Use proper HTML heading hierarchy (H1 for title, H2 for main sections, H3 for subsections, H4 for details)
   - Include 5-8 major sections with H2 headings
   - Add 2-3 H3 subsections under each H2
   - Use H4 for specific points or examples

3. **Content Quality:**
   - Write substantive, original content
   - Provide industry-specific expertise and insights
   - Include practical tips and actionable advice
   - Add real examples and case studies where relevant
   - Use bullet points and numbered lists for readability
   - Include relevant statistics or data points
   - Address common questions and concerns

4. **SEO Optimization:**
   - Naturally incorporate all keywords throughout the article
   - Create keyword-rich H2 and H3 headings
   - Write a compelling meta description (150-160 characters)
   - Use semantic HTML tags (strong, em, ul, ol, p)
   - Optimize for featured snippets where possible

5. **Engagement Elements:**
   - Start with a value proposition in the introduction
   - Use conversational language that connects with readers
   - Include call-to-action elements throughout
   - End with a strong conclusion that summarizes key points
   - Add a clear final call-to-action

6. **HTML Formatting:**
   - Use <h2>, <h3>, <h4> tags for headings
   - Use <p> tags for paragraphs
   - Use <ul> and <ol> for lists
   - Use <strong> for emphasis
   - Use <a> tags for links (we'll add these later)
   - Ensure proper nesting and closing of all tags

### Output Format
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Your compelling, SEO-optimized title here",
  "content": "<h2>Introduction</h2><p>Your engaging opening...</p><h2>Section Title</h2><h3>Subsection</h3><p>Content...</p>...",
  "meta_description": "Compelling 150-160 character description with primary keyword",
  "focus_keyword": "primary keyword phrase",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

IMPORTANT: 
- Write ENTIRELY in ${languageName}
- The content must be ${typedCampaign.word_count_min}-${typedCampaign.word_count_max} words
- Ensure the article is informative, engaging, and valuable to readers
- Make it worth reading, not just keyword-stuffed content
- Create content that establishes expertise and builds trust`;

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
            content: `You are an expert SEO content writer who creates high-quality, engaging blog articles. You write in ${languageName}. Always return valid JSON with properly formatted HTML content that uses semantic tags and proper heading hierarchy.` 
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
