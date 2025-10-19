#!/bin/bash

# Script de vérification rapide du système Product Catalogue
# Ce script vérifie que tout est prêt pour le déploiement

echo "🔍 Vérification du système Product Catalogue..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Fonction de vérification
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Vérification 1: Fichier .env existe
echo "📋 Vérification des fichiers de configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Fichier .env trouvé${NC}"
else
    echo -e "${RED}❌ Fichier .env manquant${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Vérification 2: Variables d'environnement
echo ""
echo "🔑 Vérification des variables d'environnement..."

if grep -q "VITE_SUPABASE_URL=https://ufdhzgqrubbnornjdvgv.supabase.co" .env; then
    echo -e "${GREEN}✅ VITE_SUPABASE_URL configurée${NC}"
else
    echo -e "${RED}❌ VITE_SUPABASE_URL manquante ou incorrecte${NC}"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env; then
    echo -e "${GREEN}✅ VITE_SUPABASE_ANON_KEY configurée${NC}"
else
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY manquante${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Vérification 3: node_modules
echo ""
echo "📦 Vérification des dépendances..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules installés${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules manquants - Exécutez: npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Vérification 4: Fichiers principaux
echo ""
echo "📂 Vérification des fichiers principaux..."

FILES=(
    "src/App.tsx"
    "src/main.tsx"
    "src/components/Dashboard.tsx"
    "src/lib/supabase.ts"
    "index.html"
    "package.json"
    "vite.config.ts"
    "netlify.toml"
    "inject-env.sh"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Vérification 5: Script inject-env.sh exécutable
echo ""
echo "🔧 Vérification des permissions..."
if [ -x "inject-env.sh" ]; then
    echo -e "${GREEN}✅ inject-env.sh est exécutable${NC}"
else
    echo -e "${YELLOW}⚠️  inject-env.sh n'est pas exécutable${NC}"
    echo "   Exécutez: chmod +x inject-env.sh"
    ERRORS=$((ERRORS + 1))
fi

# Vérification 6: Connexion Supabase
echo ""
echo "🌐 Test de connexion à Supabase..."

if command -v curl &> /dev/null; then
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env | cut -d '=' -f2)
    SUPABASE_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env | cut -d '=' -f2)

    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "apikey: $SUPABASE_KEY" \
            -H "Authorization: Bearer $SUPABASE_KEY" \
            "${SUPABASE_URL}/rest/v1/")

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Connexion Supabase réussie${NC}"
        else
            echo -e "${RED}❌ Erreur de connexion Supabase (HTTP $HTTP_CODE)${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    fi
else
    echo -e "${YELLOW}⚠️  curl non disponible - Test de connexion ignoré${NC}"
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tout est prêt pour le déploiement!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. npm run dev           - Tester localement"
    echo "  2. npm run build         - Construire pour production"
    echo "  3. Déployer sur Netlify  - Suivre LANCEMENT_RAPIDE.md"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
    echo ""
    echo "Corrigez les erreurs ci-dessus avant de déployer."
    echo ""
    echo "Aide:"
    echo "  - Consultez LANCEMENT_RAPIDE.md"
    echo "  - Consultez GUIDE_DEPLOIEMENT_COMPLET.md"
    echo ""
    exit 1
fi
