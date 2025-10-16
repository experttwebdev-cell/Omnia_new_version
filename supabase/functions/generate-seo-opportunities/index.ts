import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Product {
  id: string;
  title: string;
  category: string;
  sub_category: string;
  product_type: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  ai_color?: string;
  ai_material?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { products, language = 'en' } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "Products array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!deepseekKey) {
      return new Response(
        JSON.stringify({ error: "DeepSeek API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const languageInstructions: Record<string, any> = {
      fr: {
        expertRole: "Tu es un expert SEO et rédacteur e-commerce spécialisé dans le mobilier et la décoration.",
        analyzeText: "Analyse ces informations de produits",
        generateText: "Génère 3 idées d'articles de blog SEO optimisés pour cette catégorie.",
        toneText: "Le ton doit être naturel, engageant, et orienté conversion."
      },
      en: {
        expertRole: "You are an SEO expert and e-commerce writer specialized in furniture and home decor.",
        analyzeText: "Analyze this product information",
        generateText: "Generate 3 SEO-optimized blog article ideas for this category.",
        toneText: "The tone should be natural, engaging, and conversion-oriented."
      },
      es: {
        expertRole: "Eres un experto en SEO y redactor de comercio electrónico especializado en muebles y decoración.",
        analyzeText: "Analiza esta información de productos",
        generateText: "Genera 3 ideas de artículos de blog optimizados para SEO para esta categoría.",
        toneText: "El tono debe ser natural, atractivo y orientado a la conversión."
      },
      de: {
        expertRole: "Sie sind ein SEO-Experte und E-Commerce-Autor, spezialisiert auf Möbel und Heimdekoration.",
        analyzeText: "Analysieren Sie diese Produktinformationen",
        generateText: "Generieren Sie 3 SEO-optimierte Blog-Artikel-Ideen für diese Kategorie.",
        toneText: "Der Ton sollte natürlich, ansprechend und konversionsorientiert sein."
      },
      it: {
        expertRole: "Sei un esperto SEO e scrittore di e-commerce specializzato in mobili e arredamento.",
        analyzeText: "Analizza queste informazioni sui prodotti",
        generateText: "Genera 3 idee per articoli di blog ottimizzati per SEO per questa categoria.",
        toneText: "Il tono deve essere naturale, coinvolgente e orientato alla conversione."
      }
    };

    const categoryGroups = new Map<string, Product[]>();
    const subCategoryGroups = new Map<string, Product[]>();

    products.forEach((product: Product) => {
      if (product.category) {
        const key = product.category;
        if (!categoryGroups.has(key)) {
          categoryGroups.set(key, []);
        }
        categoryGroups.get(key)!.push(product);
      }

      if (product.category && product.sub_category) {
        const key = `${product.category}:${product.sub_category}`;
        if (!subCategoryGroups.has(key)) {
          subCategoryGroups.set(key, []);
        }
        subCategoryGroups.get(key)!.push(product);
      }
    });

    const allOpportunities = [];
    const MAX_CATEGORIES = 5;
    let processedCategories = 0;

    for (const [category, categoryProducts] of categoryGroups.entries()) {
      if (processedCategories >= MAX_CATEGORIES) break;

      if (categoryProducts.length >= 3) {
        processedCategories++;
        const sampleProducts = categoryProducts.slice(0, 5);
        const keywords = [...new Set(
          categoryProducts
            .flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
            .filter(Boolean)
        )].slice(0, 10);

        const productTitles = sampleProducts.map(p => p.title);
        const colors = [...new Set(categoryProducts.map(p => p.ai_color).filter(Boolean))].slice(0, 5);
        const materials = [...new Set(categoryProducts.map(p => p.ai_material).filter(Boolean))].slice(0, 5);

        const langInstr = languageInstructions[language] || languageInstructions['en'];

        const prompt = `${langInstr.expertRole}

${langInstr.analyzeText}:
- ${language === 'fr' ? 'Catégorie' : language === 'es' ? 'Categoría' : language === 'de' ? 'Kategorie' : language === 'it' ? 'Categoria' : 'Category'}: ${category}
- ${language === 'fr' ? 'Nombre de produits' : language === 'es' ? 'Número de productos' : language === 'de' ? 'Anzahl der Produkte' : language === 'it' ? 'Numero di prodotti' : 'Number of products'}: ${categoryProducts.length}
- ${language === 'fr' ? 'Titres de produits' : language === 'es' ? 'Títulos de productos' : language === 'de' ? 'Produkttitel' : language === 'it' ? 'Titoli dei prodotti' : 'Product titles'}: ${productTitles.join(', ')}
- ${language === 'fr' ? 'Couleurs' : language === 'es' ? 'Colores' : language === 'de' ? 'Farben' : language === 'it' ? 'Colori' : 'Colors'}: ${colors.length > 0 ? colors.join(', ') : 'N/A'}
- ${language === 'fr' ? 'Matériaux' : language === 'es' ? 'Materiales' : language === 'de' ? 'Materialien' : language === 'it' ? 'Materiali' : 'Materials'}: ${materials.length > 0 ? materials.join(', ') : 'N/A'}
- ${language === 'fr' ? 'Tags disponibles' : language === 'es' ? 'Etiquetas disponibles' : language === 'de' ? 'Verfügbare Tags' : language === 'it' ? 'Tag disponibili' : 'Available tags'}: ${keywords.length > 0 ? keywords.join(', ') : 'N/A'}
- ${language === 'fr' ? 'Langue cible' : language === 'es' ? 'Idioma objetivo' : language === 'de' ? 'Zielsprache' : language === 'it' ? 'Lingua di destinazione' : 'Target language'}: ${language}

${language === 'fr' ? 'IMPORTANT: Base tes opportunités UNIQUEMENT sur la catégorie, les titres de produits réels, couleurs et matériaux. N\'utilise PAS les noms de marques ou vendeurs.' : language === 'es' ? 'IMPORTANTE: Basa tus oportunidades SOLO en la categoría, títulos de productos reales, colores y materiales. NO uses nombres de marcas o vendedores.' : language === 'de' ? 'WICHTIG: Basieren Sie Ihre Möglichkeiten NUR auf der Kategorie, echten Produkttiteln, Farben und Materialien. Verwenden Sie KEINE Marken- oder Händlernamen.' : language === 'it' ? 'IMPORTANTE: Basa le tue opportunità SOLO sulla categoria, titoli di prodotti reali, colori e materiali. NON utilizzare nomi di marchi o venditori.' : 'IMPORTANT: Base your opportunities ONLY on the category, real product titles, colors and materials. Do NOT use brand names or vendor names.'}

${langInstr.generateText}

${language === 'fr' ? 'Pour chaque article, fournis' : language === 'es' ? 'Para cada artículo, proporciona' : language === 'de' ? 'Für jeden Artikel geben Sie an' : language === 'it' ? 'Per ogni articolo, fornisci' : 'For each article, provide'}:
1. **${language === 'fr' ? 'Titre SEO optimisé' : language === 'es' ? 'Título SEO optimizado' : language === 'de' ? 'SEO-optimierter Titel' : language === 'it' ? 'Titolo SEO ottimizzato' : 'SEO-optimized title'}** (${language === 'fr' ? 'moins de' : language === 'es' ? 'menos de' : language === 'de' ? 'weniger als' : language === 'it' ? 'meno di' : 'less than'} 65 ${language === 'fr' ? 'caractères' : language === 'es' ? 'caracteres' : language === 'de' ? 'Zeichen' : language === 'it' ? 'caratteri' : 'characters'})
2. **Meta description** (150-160 ${language === 'fr' ? 'caractères' : language === 'es' ? 'caracteres' : language === 'de' ? 'Zeichen' : language === 'it' ? 'caratteri' : 'characters'})
3. **${language === 'fr' ? 'Type d\'article' : language === 'es' ? 'Tipo de artículo' : language === 'de' ? 'Artikeltyp' : language === 'it' ? 'Tipo di articolo' : 'Article type'}**: "category-guide", "comparison", "how-to", "product-spotlight", "seasonal"
4. **${language === 'fr' ? 'Mots-clés principaux' : language === 'es' ? 'Palabras clave principales' : language === 'de' ? 'Hauptschlüsselwörter' : language === 'it' ? 'Parole chiave principali' : 'Primary keywords'}** (3-5 ${language === 'fr' ? 'mots-clés basés sur la catégorie et les caractéristiques des produits' : language === 'es' ? 'palabras clave basadas en categoría y características de productos' : language === 'de' ? 'Schlüsselwörter basierend auf Kategorie und Produktmerkmalen' : language === 'it' ? 'parole chiave basate su categoria e caratteristiche dei prodotti' : 'keywords based on category and product features'})
5. **${language === 'fr' ? 'Mots-clés secondaires' : language === 'es' ? 'Palabras clave secundarias' : language === 'de' ? 'Sekundäre Schlüsselwörter' : language === 'it' ? 'Parole chiave secondarie' : 'Secondary keywords'}** (3-5 ${language === 'fr' ? 'mots-clés extraits des titres de produits et caractéristiques' : language === 'es' ? 'palabras clave extraídas de títulos de productos y características' : language === 'de' ? 'Schlüsselwörter aus Produkttiteln und Merkmalen extrahiert' : language === 'it' ? 'parole chiave estratte da titoli di prodotti e caratteristiche' : 'keywords extracted from product titles and features'})
6. **${language === 'fr' ? 'Structure de l\'article' : language === 'es' ? 'Estructura del artículo' : language === 'de' ? 'Artikelstruktur' : language === 'it' ? 'Struttura dell\'articolo' : 'Article structure'}** (4-6 ${language === 'fr' ? 'sections' : language === 'es' ? 'secciones' : language === 'de' ? 'Abschnitte' : language === 'it' ? 'sezioni' : 'sections'} H2)
7. **${language === 'fr' ? 'Appel à l\'action' : language === 'es' ? 'Llamada a la acción' : language === 'de' ? 'Call-to-Action' : language === 'it' ? 'Invito all\'azione' : 'Call to action'}** (CTA)
8. **${language === 'fr' ? 'Niveau d\'opportunité SEO' : language === 'es' ? 'Nivel de oportunidad SEO' : language === 'de' ? 'SEO-Opportunitätsniveau' : language === 'it' ? 'Livello di opportunità SEO' : 'SEO opportunity level'}**: score 0-100
9. **${language === 'fr' ? 'Difficulté' : language === 'es' ? 'Dificultad' : language === 'de' ? 'Schwierigkeit' : language === 'it' ? 'Difficoltà' : 'Difficulty'}**: "easy", "medium", "hard"
10. **${language === 'fr' ? 'Extrait introductif' : language === 'es' ? 'Extracto introductorio' : language === 'de' ? 'Einleitungsauszug' : language === 'it' ? 'Estratto introduttivo' : 'Intro excerpt'}** (2-3 ${language === 'fr' ? 'phrases' : language === 'es' ? 'frases' : language === 'de' ? 'Sätze' : language === 'it' ? 'frasi' : 'sentences'})
11. **${language === 'fr' ? 'Nombre de mots estimé' : language === 'es' ? 'Número de palabras estimado' : language === 'de' ? 'Geschätzte Wortzahl' : language === 'it' ? 'Numero di parole stimato' : 'Estimated word count'}**

${language === 'fr' ? 'Réponds UNIQUEMENT en JSON valide avec ce format exact' : language === 'es' ? 'Responde SOLO en JSON válido con este formato exacto' : language === 'de' ? 'Antworten Sie NUR in gültigem JSON mit diesem genauen Format' : language === 'it' ? 'Rispondi SOLO in JSON valido con questo formato esatto' : 'Respond ONLY in valid JSON with this exact format'}:
{
  "opportunities": [
    {
      "article_title": "...",
      "meta_description": "...",
      "type": "category-guide",
      "primary_keywords": ["..."],
      "secondary_keywords": ["..."],
      "structure": {
        "h1": "...",
        "h2_sections": ["...", "..."],
        "cta": "..."
      },
      "seo_opportunity_score": 85,
      "difficulty": "medium",
      "intro_excerpt": "...",
      "estimated_word_count": 2500
    }
  ]
}

${langInstr.toneText}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
          const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${deepseekKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: langInstr.expertRole
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1500,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!deepseekResponse.ok) {
            console.error("DeepSeek API error:", await deepseekResponse.text());
            continue;
          }

          const deepseekData = await deepseekResponse.json();
          const content = deepseekData.choices[0].message.content;

          let parsedContent;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedContent = JSON.parse(jsonMatch[0]);
            } else {
              parsedContent = JSON.parse(content);
            }
          } catch (e) {
            console.error("Failed to parse DeepSeek response:", content);
            continue;
          }

          if (parsedContent.opportunities && Array.isArray(parsedContent.opportunities)) {
            parsedContent.opportunities.forEach((opp: any) => {
              allOpportunities.push({
                category: category,
                subcategory: '',
                product_ids: categoryProducts.map(p => p.id),
                article_title: opp.article_title,
                meta_description: opp.meta_description,
                type: opp.type,
                primary_keywords: opp.primary_keywords,
                secondary_keywords: opp.secondary_keywords,
                structure: opp.structure,
                seo_opportunity_score: opp.seo_opportunity_score,
                difficulty: opp.difficulty,
                intro_excerpt: opp.intro_excerpt,
                estimated_word_count: opp.estimated_word_count,
                product_count: categoryProducts.length,
              });
            });
          }
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("Timeout or error fetching from DeepSeek:", error);
          continue;
        }
      }
    }

    const MAX_SUBCATEGORIES = 3;
    let processedSubCategories = 0;

    for (const [key, subCatProducts] of subCategoryGroups.entries()) {
      if (processedSubCategories >= MAX_SUBCATEGORIES) break;
      if (allOpportunities.length >= 15) break;

      if (subCatProducts.length >= 3) {
        processedSubCategories++;
        const [category, subCategory] = key.split(':');
        const sampleProducts = subCatProducts.slice(0, 3);
        const keywords = [...new Set(
          subCatProducts
            .flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
            .filter(Boolean)
        )].slice(0, 8);

        const productTitles = sampleProducts.map(p => p.title);
        const colors = [...new Set(subCatProducts.map(p => p.ai_color).filter(Boolean))].slice(0, 3);
        const materials = [...new Set(subCatProducts.map(p => p.ai_material).filter(Boolean))].slice(0, 3);

        const langInstr = languageInstructions[language] || languageInstructions['en'];

        const prompt = `${langInstr.expertRole}

${langInstr.analyzeText}:
- ${language === 'fr' ? 'Catégorie' : language === 'es' ? 'Categoría' : language === 'de' ? 'Kategorie' : language === 'it' ? 'Categoria' : 'Category'}: ${category}
- ${language === 'fr' ? 'Sous-catégorie' : language === 'es' ? 'Subcategoría' : language === 'de' ? 'Unterkategorie' : language === 'it' ? 'Sottocategoria' : 'Subcategory'}: ${subCategory}
- ${language === 'fr' ? 'Nombre de produits' : language === 'es' ? 'Número de productos' : language === 'de' ? 'Anzahl der Produkte' : language === 'it' ? 'Numero di prodotti' : 'Number of products'}: ${subCatProducts.length}
- ${language === 'fr' ? 'Titres de produits' : language === 'es' ? 'Títulos de productos' : language === 'de' ? 'Produkttitel' : language === 'it' ? 'Titoli dei prodotti' : 'Product titles'}: ${productTitles.join(', ')}
- ${language === 'fr' ? 'Couleurs' : language === 'es' ? 'Colores' : language === 'de' ? 'Farben' : language === 'it' ? 'Colori' : 'Colors'}: ${colors.length > 0 ? colors.join(', ') : 'N/A'}
- ${language === 'fr' ? 'Matériaux' : language === 'es' ? 'Materiales' : language === 'de' ? 'Materialien' : language === 'it' ? 'Materiali' : 'Materials'}: ${materials.length > 0 ? materials.join(', ') : 'N/A'}
- ${language === 'fr' ? 'Tags' : language === 'es' ? 'Etiquetas' : language === 'de' ? 'Tags' : language === 'it' ? 'Tag' : 'Tags'}: ${keywords.length > 0 ? keywords.join(', ') : 'N/A'}
- ${language === 'fr' ? 'Langue' : language === 'es' ? 'Idioma' : language === 'de' ? 'Sprache' : language === 'it' ? 'Lingua' : 'Language'}: ${language}

${language === 'fr' ? 'IMPORTANT: Base ton opportunité UNIQUEMENT sur la catégorie, sous-catégorie, titres de produits réels, couleurs et matériaux. N\'utilise PAS de noms de marques ou vendeurs.' : language === 'es' ? 'IMPORTANTE: Basa tu oportunidad SOLO en categoría, subcategoría, títulos de productos reales, colores y materiales. NO uses nombres de marcas o vendedores.' : language === 'de' ? 'WICHTIG: Basieren Sie Ihre Möglichkeit NUR auf Kategorie, Unterkategorie, echten Produkttiteln, Farben und Materialien. Verwenden Sie KEINE Marken- oder Händlernamen.' : language === 'it' ? 'IMPORTANTE: Basa la tua opportunità SOLO su categoria, sottocategoria, titoli di prodotti reali, colori e materiali. NON utilizzare nomi di marchi o venditori.' : 'IMPORTANT: Base your opportunity ONLY on category, subcategory, real product titles, colors and materials. Do NOT use brand names or vendor names.'}

${language === 'fr' ? 'Génère 1 idée d\'article de blog SEO optimisé spécifiquement pour cette sous-catégorie.' : language === 'es' ? 'Genera 1 idea de artículo de blog optimizado para SEO específicamente para esta subcategoría.' : language === 'de' ? 'Generieren Sie 1 SEO-optimierte Blog-Artikel-Idee speziell für diese Unterkategorie.' : language === 'it' ? 'Genera 1 idea per un articolo di blog ottimizzato per SEO specificamente per questa sottocategoria.' : 'Generate 1 SEO-optimized blog article idea specifically for this subcategory.'}

${language === 'fr' ? 'Réponds en JSON avec le même format que précédemment (1 seule opportunité).' : language === 'es' ? 'Responde en JSON con el mismo formato que antes (1 sola oportunidad).' : language === 'de' ? 'Antworten Sie in JSON mit dem gleichen Format wie zuvor (1 Gelegenheit).' : language === 'it' ? 'Rispondi in JSON con lo stesso formato di prima (1 sola opportunità).' : 'Respond in JSON with the same format as before (1 opportunity only).'}`;

        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 20000);

        try {
          const deepseekResponse2 = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${deepseekKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: `${langInstr.expertRole} ${language === 'fr' ? 'Réponds uniquement en JSON valide.' : language === 'es' ? 'Responde solo en JSON válido.' : language === 'de' ? 'Antworten Sie nur in gültigem JSON.' : language === 'it' ? 'Rispondi solo in JSON valido.' : 'Respond only in valid JSON.'}`
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1000,
            }),
            signal: controller2.signal,
          });

          clearTimeout(timeoutId2);

          if (deepseekResponse2.ok) {
            const deepseekData2 = await deepseekResponse2.json();
            const content = deepseekData2.choices[0].message.content;

            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              const parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

            if (parsedContent.opportunities && Array.isArray(parsedContent.opportunities)) {
              parsedContent.opportunities.forEach((opp: any) => {
                allOpportunities.push({
                  category: category,
                  subcategory: subCategory,
                  product_ids: subCatProducts.map(p => p.id),
                  article_title: opp.article_title,
                  meta_description: opp.meta_description,
                  type: opp.type,
                  primary_keywords: opp.primary_keywords,
                  secondary_keywords: opp.secondary_keywords,
                  structure: opp.structure,
                  seo_opportunity_score: opp.seo_opportunity_score,
                  difficulty: opp.difficulty,
                  intro_excerpt: opp.intro_excerpt,
                  estimated_word_count: opp.estimated_word_count,
                  product_count: subCatProducts.length,
                });
              });
            }
            } catch (e) {
              console.error("Failed to parse subcategory response:", content);
            }
          }
        } catch (error) {
          clearTimeout(timeoutId2);
          console.error("Timeout or error fetching subcategory from DeepSeek:", error);
        }
      }
    }

    allOpportunities.sort((a, b) => b.seo_opportunity_score - a.seo_opportunity_score);

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: allOpportunities,
        total: allOpportunities.length
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error in generate-seo-opportunities:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
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