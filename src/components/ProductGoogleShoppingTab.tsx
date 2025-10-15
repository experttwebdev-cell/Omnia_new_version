import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save,
  RefreshCw,
  ShoppingBag,
  Tag,
  Users,
  Baby,
  Package,
  Barcode,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Upload
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { LoadingAnimation } from './LoadingAnimation';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface ProductGoogleShoppingTabProps {
  product: Product;
  onProductUpdate: () => void;
}

const GOOGLE_PRODUCT_CATEGORIES = [
  'Apparel & Accessories',
  'Apparel & Accessories > Clothing',
  'Apparel & Accessories > Clothing > Dresses',
  'Apparel & Accessories > Clothing > Shirts & Tops',
  'Apparel & Accessories > Clothing > Pants',
  'Apparel & Accessories > Shoes',
  'Furniture',
  'Furniture > Chairs',
  'Furniture > Tables',
  'Furniture > Tables > Coffee Tables',
  'Furniture > Tables > Dining Tables',
  'Furniture > Sofas',
  'Furniture > Beds & Accessories',
  'Home & Garden',
  'Home & Garden > Decor',
  'Home & Garden > Lighting',
  'Electronics',
  'Electronics > Computers',
  'Electronics > Audio',
  'Sporting Goods',
  'Toys & Games',
  'Health & Beauty',
  'Food, Beverages & Tobacco'
];

export function ProductGoogleShoppingTab({ product, onProductUpdate }: ProductGoogleShoppingTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [formData, setFormData] = useState({
    google_product_category: product.google_product_category || '',
    google_gender: product.google_gender || '',
    google_age_group: product.google_age_group || 'adult',
    google_mpn: product.google_mpn || '',
    google_gtin: product.google_gtin || '',
    google_condition: product.google_condition || 'new',
    google_custom_product: product.google_custom_product || false,
    google_custom_label_0: product.google_custom_label_0 || '',
    google_custom_label_1: product.google_custom_label_1 || '',
    google_custom_label_2: product.google_custom_label_2 || '',
    google_custom_label_3: product.google_custom_label_3 || '',
    google_custom_label_4: product.google_custom_label_4 || '',
    google_brand: product.google_brand || product.vendor || '',
    google_availability: product.inventory_quantity > 0 ? 'in stock' : 'out of stock'
  });

  useEffect(() => {
    if (!formData.google_gtin) {
      generateGTIN();
    }
  }, []);

  const generateGTIN = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_products')
        .select('google_gtin')
        .eq('id', product.id)
        .maybeSingle();

      if (!error && data?.google_gtin) {
        setFormData(prev => ({ ...prev, google_gtin: data.google_gtin }));
      }
    } catch (err) {
      console.error('Error fetching GTIN:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from('shopify_products')
        .update({
          google_product_category: formData.google_product_category,
          google_gender: formData.google_gender,
          google_age_group: formData.google_age_group,
          google_mpn: formData.google_mpn,
          google_gtin: formData.google_gtin,
          google_condition: formData.google_condition,
          google_custom_product: formData.google_custom_product,
          google_custom_label_0: formData.google_custom_label_0,
          google_custom_label_1: formData.google_custom_label_1,
          google_custom_label_2: formData.google_custom_label_2,
          google_custom_label_3: formData.google_custom_label_3,
          google_custom_label_4: formData.google_custom_label_4,
          google_brand: formData.google_brand,
          google_availability: formData.google_availability
        })
        .eq('id', product.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Google Shopping data saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
      onProductUpdate();
    } catch (err) {
      console.error('Error saving Google Shopping data:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToShopify = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      await handleSave();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-shopping-to-shopify`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: [product.id] }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to sync to Shopify');
      }

      setMessage({ type: 'success', text: 'Successfully synced to Shopify metafields!' });
      setTimeout(() => setMessage(null), 3000);
      onProductUpdate();
    } catch (err) {
      console.error('Error syncing to Shopify:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to sync to Shopify' });
    } finally {
      setSyncing(false);
    }
  };

  const filteredCategories = GOOGLE_PRODUCT_CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const getCompletionStatus = () => {
    const requiredFields = [
      formData.google_product_category,
      formData.google_brand,
      formData.google_gtin,
      formData.google_condition
    ];
    const completed = requiredFields.filter(Boolean).length;
    return { completed, total: requiredFields.length, percentage: (completed / requiredFields.length) * 100 };
  };

  const status = getCompletionStatus();

  if (loading) {
    return <LoadingAnimation type="content" message="Loading Google Shopping data..." />;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-start gap-2 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Google Shopping Feed Configuration</h3>
              <p className="text-sm text-gray-600">Configure product attributes for Google Merchant Center</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{status.completed}/{status.total}</div>
            <div className="text-xs text-gray-600">Required Fields</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Product Classification</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Product Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.google_product_category || categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setFormData({ ...formData, google_product_category: e.target.value });
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Search or enter category..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {showCategoryDropdown && filteredCategories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCategories.slice(0, 10).map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setFormData({ ...formData, google_product_category: category });
                          setCategorySearch('');
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 transition"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select from Google's product taxonomy</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.google_condition}
                onChange={(e) => setFormData({ ...formData, google_condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="new">New</option>
                <option value="refurbished">Refurbished</option>
                <option value="used">Used</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={formData.google_availability}
                onChange={(e) => setFormData({ ...formData, google_availability: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="in stock">In Stock</option>
                <option value="out of stock">Out of Stock</option>
                <option value="preorder">Preorder</option>
                <option value="backorder">Backorder</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Barcode className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Product Identifiers</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.google_brand}
                onChange={(e) => setFormData({ ...formData, google_brand: e.target.value })}
                placeholder="Product brand or manufacturer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GTIN (Global Trade Item Number) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.google_gtin}
                  onChange={(e) => setFormData({ ...formData, google_gtin: e.target.value })}
                  placeholder="Auto-generated EAN-13"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  readOnly
                />
                <button
                  onClick={generateGTIN}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
                  title="Regenerate GTIN"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-generated EAN-13 barcode format</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPN (Manufacturer Part Number)
              </label>
              <input
                type="text"
                value={formData.google_mpn}
                onChange={(e) => setFormData({ ...formData, google_mpn: e.target.value })}
                placeholder="Manufacturer's part number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Demographics</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.google_gender}
                onChange={(e) => setFormData({ ...formData, google_gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={formData.google_age_group}
                onChange={(e) => setFormData({ ...formData, google_age_group: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="adult">Adult</option>
                <option value="kids">Kids</option>
                <option value="toddler">Toddler</option>
                <option value="infant">Infant</option>
                <option value="newborn">Newborn</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.google_custom_product}
                  onChange={(e) => setFormData({ ...formData, google_custom_product: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Custom Product</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Mark if this is a custom or made-to-order product</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Custom Labels</h4>
          </div>

          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Label {index}
                </label>
                <input
                  type="text"
                  value={formData[`google_custom_label_${index}` as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [`google_custom_label_${index}`]: e.target.value })}
                  placeholder={`Custom label ${index} for filtering`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">Use custom labels for campaign targeting and filtering</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {product.google_synced_at && (
            <p>Last synced: {new Date(product.google_synced_at).toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || syncing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save
              </>
            )}
          </button>
          <button
            onClick={handleSyncToShopify}
            disabled={saving || syncing}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            {syncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing to Shopify...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Sync to Shopify
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
