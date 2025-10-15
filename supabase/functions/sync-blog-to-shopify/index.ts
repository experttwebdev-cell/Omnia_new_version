import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  articleId: string;
}

interface BlogArticle {
  id: string;
  store_id?: string;
  campaign_id?: string;
  title: string;
  content: string;
  excerpt: string;
  target_keywords: string[];
  tags: string;
  author: string;
  related_product_ids: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId }: RequestBody = await req.json();

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: article, error: articleError } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedArticle = article as unknown as BlogArticle;

    let storeId = typedArticle.store_id;

    if (!storeId) {
      const { data: campaign } = await supabase
        .from('blog_campaigns')
        .select('store_id')
        .eq('id', typedArticle.campaign_id || '')
        .maybeSingle();

      if (campaign?.store_id) {
        storeId = campaign.store_id;
      }
    }

    if (!storeId && typedArticle.related_product_ids && typedArticle.related_product_ids.length > 0) {
      const { data: product } = await supabase
        .from('shopify_products')
        .select('store_id')
        .eq('id', typedArticle.related_product_ids[0])
        .maybeSingle();

      if (product?.store_id) {
        storeId = product.store_id;
      }
    }

    if (!storeId) {
      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1);

      if (stores && stores.length > 0) {
        storeId = stores[0].id;
      }
    }

    if (!storeId) {
      return new Response(
        JSON.stringify({
          error: 'No store found for this article. Please configure a Shopify store first.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: store, error: storeError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Store configuration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('blog_articles')
      .update({ sync_status: 'syncing' })
      .eq('id', articleId);

    const shopifyUrl = `https://${store.store_url}/admin/api/2024-01/blogs.json`;
    const blogsResponse = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': store.api_token,
      },
    });

    if (!blogsResponse.ok) {
      throw new Error('Failed to fetch Shopify blogs');
    }

    const blogsData = await blogsResponse.json();
    const blogId = blogsData.blogs?.[0]?.id;

    if (!blogId) {
      throw new Error('No blog found in Shopify store');
    }

    const articleData = {
      article: {
        title: typedArticle.title,
        body_html: typedArticle.content,
        author: typedArticle.author || 'Admin',
        tags: typedArticle.tags || (typedArticle.target_keywords || []).join(', '),
        published: true,
      },
    };

    const createArticleUrl = `https://${store.store_url}/admin/api/2024-01/blogs/${blogId}/articles.json`;
    const createResponse = await fetch(createArticleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': store.api_token,
      },
      body: JSON.stringify(articleData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      throw new Error(`Failed to create article in Shopify: ${errorData}`);
    }

    const createdArticle = await createResponse.json();
    const shopifyArticleId = createdArticle.article?.id;

    await supabase
      .from('blog_articles')
      .update({
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        shopify_blog_id: blogId,
        shopify_article_id: shopifyArticleId,
        sync_error: '',
      })
      .eq('id', articleId);

    return new Response(
      JSON.stringify({ success: true, shopifyArticleId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing article to Shopify:', error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});