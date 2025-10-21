-- Créer la table subscription_plans si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  max_products INTEGER NOT NULL,
  max_optimizations_monthly INTEGER NOT NULL,
  max_articles_monthly INTEGER NOT NULL,
  max_campaigns INTEGER NOT NULL,
  max_chat_responses_monthly INTEGER NOT NULL,
  features JSONB,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les forfaits par défaut
INSERT INTO subscription_plans (
  id, name, description, price_monthly, price_yearly, 
  max_products, max_optimizations_monthly, max_articles_monthly, 
  max_campaigns, max_chat_responses_monthly, features
) VALUES 
(
  'starter',
  'Starter',
  'Parfait pour commencer',
  29,
  278,
  100,
  50,
  10,
  3,
  1000,
  '["100 produits maximum", "50 optimisations SEO/mois", "10 articles de blog/mois", "3 campagnes marketing", "1000 réponses chat/mois", "Support email"]'
),
(
  'professional',
  'Professional',
  'Recommandé pour les entreprises',
  79,
  758,
  500,
  200,
  50,
  10,
  5000,
  '["500 produits maximum", "200 optimisations SEO/mois", "50 articles de blog/mois", "10 campagnes marketing", "5000 réponses chat/mois", "Support prioritaire", "Analytics avancées"]'
),
(
  'enterprise',
  'Enterprise',
  'Solution complète pour les grandes entreprises',
  199,
  1910,
  -1,
  -1,
  -1,
  -1,
  -1,
  '["Produits illimités", "Optimisations SEO illimitées", "Articles de blog illimités", "Campagnes marketing illimitées", "Réponses chat illimitées", "Support dédié 24/7", "API personnalisée", "Formation équipe"]'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_products = EXCLUDED.max_products,
  max_optimizations_monthly = EXCLUDED.max_optimizations_monthly,
  max_articles_monthly = EXCLUDED.max_articles_monthly,
  max_campaigns = EXCLUDED.max_campaigns,
  max_chat_responses_monthly = EXCLUDED.max_chat_responses_monthly,
  features = EXCLUDED.features,
  updated_at = NOW();