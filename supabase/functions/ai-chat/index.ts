//
// 🧩 FONCTION PRINCIPALE - VERSION STABLE
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string,
  onChunk?: (text: string) => void
): Promise<ChatResponse> {
  console.log("🚀 [OMNIA] Message reçu:", userMessage);

  // ✅ Gestion immédiate des salutations simples
  const msg = userMessage.toLowerCase().trim();
  
  if (["bonjour", "salut", "hello", "coucou", "hey"].some(greet => msg.includes(greet))) {
    return {
      role: "assistant",
      content: "Bonjour ! 👋 Je suis OmnIA, votre assistant shopping. Que souhaitez-vous découvrir aujourd'hui ?",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }

  try {
    const intent = await detectIntent(userMessage);

    // Configuration des filtres
    const filters: ProductAttributes = { 
      intent: "product_search", 
      sector: "meubles" 
    };

    // Détection du secteur (code existant...)
    if (["montre", "bracelet", "bijou", "horlogerie", "chrono"].some(x => msg.includes(x))) {
      filters.sector = "montres";
    } else if (["robe", "chemise", "pantalon", "vêtement", "vetement", "mode", "sac", "chaussure"].some(x => msg.includes(x))) {
      filters.sector = "pret_a_porter";
    }

    // Mode conversation simple
    if (intent === "chat") {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Tu es OmnIA, assistant e-commerce amical et professionnel. 
Réponds de manière concise, naturelle et utile (80-120 mots maximum).
Sois chaleureux et engageant.`
        },
        { role: "user", content: userMessage },
      ];

      const chatResponse = await callDeepSeek(messages, 120);

      return {
        role: "assistant",
        content: chatResponse,
        intent: "conversation",
        products: [],
        mode: "conversation",
        sector: filters.sector || "meubles",
      };
    }

    // 🔍 RECHERCHE PRODUIT
    const products = await searchProducts(filters, storeId);
    
    // ✅ Utiliser le streaming si disponible, sinon fallback
    let aiResponse = "";
    
    if (onChunk) {
      try {
        await streamDeepSeek(
          [
            {
              role: "system",
              content: `Tu es OmnIA, expert e-commerce. Présente les produits de manière engageante et naturelle. Réponse en français (120-180 mots).`
            },
            { role: "user", content: `Produits: ${JSON.stringify(products.map(p => p.title))}. Demande: ${userMessage}` }
          ],
          onChunk
        );
        aiResponse = ""; // Le contenu est streamé via onChunk
      } catch (streamError) {
        console.error("Stream failed, using fallback:", streamError);
        aiResponse = await generateProductPresentation(products, userMessage, filters.sector || "meubles");
      }
    } else {
      aiResponse = await generateProductPresentation(products, userMessage, filters.sector || "meubles");
    }

    return {
      role: "assistant",
      content: aiResponse,
      intent: "product_show",
      products,
      mode: "product_show",
      sector: filters.sector || "meubles",
    };

  } catch (error) {
    console.error("❌ [OMNIA] Global error:", error);
    
    // ✅ Fallback générique en cas d'erreur globale
    return {
      role: "assistant",
      content: "Je suis désolé, je rencontre un problème technique. Pouvez-vous réessayer dans un instant ? En attendant, vous pouvez me décrire ce que vous cherchez !",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }
}