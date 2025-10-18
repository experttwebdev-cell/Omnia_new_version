import { ExternalLink, ShoppingCart, Star, Tag } from 'lucide-react';
import { formatPrice } from '../lib/currency'; // Make sure to import your currency formatter

interface ProductCardProps {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number;
  description?: string;
  handle: string;
  storeUrl: string;
  category?: string;
  vendor?: string;
  currency?: string;
  showCta?: boolean;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  badge?: string;
}

export function ProductCard({
  productId,
  title,
  imageUrl,
  price,
  compareAtPrice,
  description,
  handle,
  storeUrl,
  category,
  vendor,
  currency = 'EUR',
  showCta = true,
  featured = false,
  rating,
  reviewCount,
  tags = [],
  badge
}: ProductCardProps) {
  const productUrl = `https://${storeUrl}/products/${handle}`;
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercentage = hasDiscount 
    ? Math.round(100 - (price / compareAtPrice) * 100)
    : 0;

  return (
    <div
      className={`product-card group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 ${
        featured ? 'ring-2 ring-blue-500' : ''
      }`}
      data-product-id={productId}
    >
      <div className="product-image relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl || '/placeholder-product.jpg'}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.jpg';
          }}
        />
        
        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {badge && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {badge}
            </div>
          )}
          {hasDiscount && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              -{discountPercentage}%
            </div>
          )}
          {featured && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Featured
            </div>
          )}
        </div>

        {category && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            {category}
          </div>
        )}
      </div>

      <div className="product-details p-5">
        {/* Vendor */}
        {vendor && (
          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
            {vendor}
          </p>
        )}

        {/* Title */}
        <h3 className="product-title text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Rating */}
        {rating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {reviewCount !== undefined && (
              <span className="text-xs text-gray-500">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="product-price flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(compareAtPrice, currency)}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="product-description text-sm text-gray-600 mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        {showCta && (
          <a
            href={productUrl}
            className="product-cta inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group/cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ShoppingCart className="w-4 h-4 transition-transform group-hover/cta:scale-110" />
            <span>View Product</span>
            <ExternalLink className="w-4 h-4 transition-transform group-hover/cta:scale-110" />
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
  currency?: string;
  price?: number;
  children?: React.ReactNode;
}

export function ProductInlineLink({ 
  title, 
  handle, 
  storeUrl, 
  currency = 'EUR',
  price,
  children 
}: ProductInlineLinkProps) {
  const productUrl = `https://${storeUrl}/products/${handle}`;

  return (
    <a
      href={productUrl}
      className="inline-product-link group inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${title}`}
    >
      {children || (
        <>
          <span>{title}</span>
          {price !== undefined && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {formatPrice(price, currency)}
            </span>
          )}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}
    </a>
  );
}

interface ProductGalleryProps {
  products: Array<{
    productId: string;
    title: string;
    imageUrl: string;
    price: number;
    compareAtPrice?: number;
    handle: string;
    category?: string;
    vendor?: string;
    currency?: string;
    rating?: number;
    reviewCount?: number;
    tags?: string[];
    featured?: boolean;
    badge?: string;
  }>;
  storeUrl: string;
  title?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function ProductGallery({ 
  products, 
  storeUrl, 
  title,
  columns = 3 
}: ProductGalleryProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <section className="product-gallery my-12">
      {title && (
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {title}
        </h2>
      )}

      <div className={`grid ${gridClasses[columns]} gap-6 lg:gap-8`}>
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            productId={product.productId}
            title={product.title}
            imageUrl={product.imageUrl}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            handle={product.handle}
            storeUrl={storeUrl}
            category={product.category}
            vendor={product.vendor}
            currency={product.currency}
            rating={product.rating}
            reviewCount={product.reviewCount}
            tags={product.tags}
            featured={product.featured}
            badge={product.badge}
          />
        ))}
      </div>
    </section>
  );
}