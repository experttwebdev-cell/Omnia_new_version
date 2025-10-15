import { ExternalLink, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  description?: string;
  handle: string;
  storeUrl: string;
  category?: string;
  showCta?: boolean;
}

export function ProductCard({
  productId,
  title,
  imageUrl,
  price,
  description,
  handle,
  storeUrl,
  category,
  showCta = true
}: ProductCardProps) {
  const productUrl = `https://${storeUrl}/products/${handle}`;

  return (
    <div
      className="product-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
      data-product-id={productId}
    >
      <div className="product-image relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl || 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'}
          alt={`${title}${category ? ` - ${category}` : ''}`}
          loading="lazy"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg';
          }}
        />
        {category && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {category}
          </div>
        )}
      </div>

      <div className="product-details p-5">
        <h3 className="product-title text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>

        <div className="product-price text-2xl font-bold text-blue-600 mb-3">
          {price.toFixed(2)}€
        </div>

        {description && (
          <p className="product-description text-sm text-gray-600 mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {showCta && (
          <a
            href={productUrl}
            className="product-cta inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ShoppingCart className="w-4 h-4" />
            Découvrir ce produit
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

interface ProductInlineLinkProps {
  title: string;
  handle: string;
  storeUrl: string;
  children?: React.ReactNode;
}

export function ProductInlineLink({ title, handle, storeUrl, children }: ProductInlineLinkProps) {
  const productUrl = `https://${storeUrl}/products/${handle}`;

  return (
    <a
      href={productUrl}
      className="inline-product-link text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      title={`Voir ${title}`}
    >
      {children || title}
    </a>
  );
}

interface ProductGalleryProps {
  products: Array<{
    productId: string;
    title: string;
    imageUrl: string;
    price: number;
    handle: string;
    category?: string;
  }>;
  storeUrl: string;
  title?: string;
}

export function ProductGallery({ products, storeUrl, title }: ProductGalleryProps) {
  return (
    <section className="product-gallery my-12">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{title}</h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            productId={product.productId}
            title={product.title}
            imageUrl={product.imageUrl}
            price={product.price}
            handle={product.handle}
            storeUrl={storeUrl}
            category={product.category}
          />
        ))}
      </div>
    </section>
  );
}
