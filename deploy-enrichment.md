# Redéploiement de la fonction enrichment

## Modifications effectuées :

1. ✅ **Logs de debug Vision API** ajoutés :
   - Vision Analysis démarrage/fin
   - Compteur d'images
   - Présence API Key OpenAI
   - Statut HTTP Vision
   - Couleur/matériau/style détectés
   - Valeurs finales

2. ✅ **Google Brand ajouté** :
   - Rempli automatiquement depuis `vendor`
   - Stocké dans `google_brand`

3. ✅ **Landing page mise à jour** :
   - Affiche dimensions, caractéristiques, Google category, Google brand

## Pour redéployer :

La fonction est prête dans `/tmp/cc-agent/58620992/project/supabase/functions/enrich-product-with-ai/index.ts`

Utiliser le dashboard Supabase ou CLI pour déployer.

## Pour tester :

1. Ouvrir `test-vision-color.html` dans le navigateur
2. Cliquer sur "Enrichir Produit"
3. Vérifier les logs dans l'interface
4. Vérifier les logs Supabase pour les détails Vision API

## Checklist de debug Vision Color :

- [ ] Vérifier que le produit a des images dans `product_images`
- [ ] Vérifier que `OPENAI_API_KEY` est configurée
- [ ] Vérifier les logs : "Images count: X"
- [ ] Vérifier les logs : "OpenAI API Key present: true"
- [ ] Vérifier les logs : "Vision API response status: 200"
- [ ] Vérifier les logs : "Color detected: [valeur]"
- [ ] Vérifier le JSON brut retourné par Vision

Si la couleur est toujours vide malgré un statut 200, le problème vient du prompt ou du JSON retourné par GPT-4o Vision.
