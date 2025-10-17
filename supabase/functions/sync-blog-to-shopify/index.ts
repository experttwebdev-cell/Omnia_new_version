import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Nettoie une URL Shopify pour éviter les doublons ou erreurs
function normalizeStoreUrl(url: string): string {
  if (!url) return "";
  return url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { articleId } = await req.json();
    if (!articleId)
      return respond(400, { error: "Missing articleId" });

    // 1️⃣ Charger l’article depuis Supabase
    const { data: article, error: articleError } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (articleError || !article)
      return respond(404, { error: "Article not found" });

    console.log("📝 Syncing article:", article.title);

    // 2️⃣ Déterminer le store à utiliser
    let storeId = article.store_id;

    if (!storeId && article.campaign_id) {
      const { data: campaign } = await supabase
        .from("blog_campaigns")
        .select("store_id")
        .eq("id", article.campaign_id)
        .maybeSingle();
      storeId = campaign?.store_id;
    }

    if (!storeId && article.related_product_ids?.length) {
      const { data: product } = await supabase
        .from("shopify_products")
        .select("store_id")
        .eq("id", article.related_product_ids[0])
        .maybeSingle();
      storeId = product?.store_id;
    }

    if (!storeId) {
      const { data: storeFallback } = await supabase
        .from("shopify_stores")
        .select("id")
        .limit(1);
      storeId = storeFallback?.[0]?.id;
    }

    if (!storeId)
      return respond(400, {
        error: "No store found for this article — please configure a Shopify store first.",
      });

    // 3️⃣ Récupérer la configuration Shopify
    const { data: store, error: storeError } = await supabase
      .from("shopify_stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (storeError || !store)
      return respond(404, { error: "Shopify store configuration not found" });

    const accessToken = store.api_token;
    if (!accessToken)
      return respond(400, { error: "Missing Shopify access token for store." });

    const normalizedStoreUrl =
      normalizeStoreUrl(store.store_url || store.domain || "");
    const apiBase = `https://${normalizedStoreUrl}/admin/api/2024-01`;

    // 4️⃣ Marquer l’article en "syncing"
    await supabase
      .from("blog_articles")
      .update({ sync_status: "syncing", sync_error: "" })
      .eq("id", articleId);

    // 5️⃣ Récupérer un blog Shopify (ou utiliser store.blog_id si défini)
    let blogId = store.blog_id;
    if (!blogId) {
      console.log("Fetching available blogs from Shopify...");
      const blogsResp = await fetch(`${apiBase}/blogs.json`, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });
      if (!blogsResp.ok)
        throw new Error(
          `Failed to fetch Shopify blogs (${blogsResp.status})`
        );
      const blogsData = await blogsResp.json();
      blogId = blogsData.blogs?.[0]?.id;
    }

    if (!blogId)
      throw new Error("No blog found in Shopify store");

    // 6️⃣ Créer ou mettre à jour l’article dans Shopify
    const articleData = {
      article: {
        title: article.title,
        body_html: article.content || article.content_html || "",
        author: article.author || "Admin",
        tags:
          article.tags ||
          (Array.isArray(article.target_keywords)
            ? article.target_keywords.join(", ")
            : ""),
        published: true,
      },
    };

    const shopifyUrl = `${apiBase}/blogs/${blogId}/articles.json`;
    console.log("Publishing article to Shopify blog:", shopifyUrl);

    const createRes = await fetch(shopifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify(articleData),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Shopify publish failed: ${errText}`);
    }

    const created = await createRes.json();
    const shopifyArticleId = created.article?.id;

    // 7️⃣ Mise à jour finale en base
    await supabase
      .from("blog_articles")
      .update({
        sync_status: "synced",
        last_synced_at: new Date().toISOString(),
        shopify_blog_id: blogId,
        shopify_article_id: shopifyArticleId,
        sync_error: "",
      })
      .eq("id", articleId);

    console.log("✅ Article published successfully:", shopifyArticleId);

    return respond(200, { success: true, shopifyArticleId });
  } catch (error) {
    console.error("❌ Error syncing article to Shopify:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during sync";

    try {
      const body = await req.json().catch(() => ({}));
      if (body.articleId) {
        await createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        )
          .from("blog_articles")
          .update({
            sync_status: "failed",
            sync_error: message,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", body.articleId);
      }
    } catch (updateErr) {
      console.error("⚠️ Failed to update article status:", updateErr);
    }

    return respond(500, { error: message });
  }
});

function respond(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
