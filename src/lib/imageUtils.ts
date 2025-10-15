export function extractFirstImageFromHtml(htmlContent: string): string | null {
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = htmlContent.match(imgRegex);
  return match ? match[1] : null;
}

export function getCategoryPlaceholderImage(category: string): string {
  const categoryImageMap: Record<string, number> = {
    'canapé': 1350789,
    'sofa': 1350789,
    'table': 1080721,
    'chaise': 963486,
    'chair': 963486,
    'lit': 164595,
    'bed': 164595,
    'armoire': 1669799,
    'wardrobe': 1669799,
    'bureau': 245219,
    'desk': 245219,
    'lampe': 1090638,
    'lamp': 1090638,
    'tapis': 1350789,
    'rug': 1350789,
    'coussin': 1918291,
    'pillow': 1918291,
    'rideau': 2045248,
    'curtain': 2045248,
    'miroir': 1094770,
    'mirror': 1094770,
    'étagère': 1005058,
    'shelf': 1005058,
    'décoration': 1090638,
    'decoration': 1090638,
    'default': 1350789
  };

  const categoryLower = category.toLowerCase();
  const imageId = categoryImageMap[categoryLower] || categoryImageMap['default'];

  return `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=600`;
}

export function getArticleThumbnail(content: string, category?: string): string {
  const extractedImage = extractFirstImageFromHtml(content);
  if (extractedImage) {
    return extractedImage;
  }

  return getCategoryPlaceholderImage(category || 'default');
}

export function extractProductImageFromProduct(product: any): string | null {
  if (product.image_url) {
    return product.image_url;
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0].src || product.images[0].url || null;
  }

  return null;
}
