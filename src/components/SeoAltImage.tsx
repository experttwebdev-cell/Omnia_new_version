import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import { Search, RefreshCw, Image as ImageIcon, Sparkles, Upload, Loader2, Package, CheckCircle, Clock, Check, Grid3x3, List } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { ProgressModal } from './ProgressModal';
import { ConfirmDialog } from './ConfirmDialog';
import { useNotifications, NotificationSystem } from './NotificationSystem';

type Product = Database['public']['Tables']['shopify_products']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductWithImages extends Product {
  images: ProductImage[];
}

type AltImageTab = 'all' | 'needs-alt' | 'has-alt' | 'to-sync';

export function SeoAltImage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AltImageTab>('all');
  const [quickStats, setQuickStats] = useState<any>(null);
  const [generatingSelected, setGeneratingSelected] = useState(false);
  const [syncingSelected, setSyncingSelected] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'generate' | 'sync' | null>(null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const IMAGES_PER_PAGE = 50;

  const fetchQuickStats = async () => {
    try {
      const { data, error: statsError } = await supabase
        .from('seo_tabs_aggregate_stats')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!statsError && data) {
        setQuickStats(data);
      }
    } catch (err) {
      console.error('Error fetching quick stats:', err);
    }
  };

  const fetchProductsWithImages = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: productsData, error: productsError } = await supabase
        .from('shopify_products')
        .select('id, title, vendor, category, shop_name, imported_at')
        .order('imported_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .order('position', { ascending: true });

      if (imagesError) throw imagesError;

      const productMap = new Map<string, ProductWithImages>();

      (productsData || []).forEach((prod) => {
        productMap.set(prod.id, {
          ...prod,
          images: []
        } as ProductWithImages);
      });

      (imagesData || []).forEach((img) => {
        const product = productMap.get(img.product_id);
        if (product) {
          product.images.push(img);
        }
      });

      setProducts(Array.from(productMap.values()).filter(p => p.images.length > 0));
      await fetchQuickStats();
    } catch (err) {
      console.error('Error fetching products with images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsWithImages();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    return product.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  let allImages = filteredProducts.flatMap(p =>
    p.images.map(img => ({
      ...img,
      productTitle: p.title,
      productId: p.id
    }))
  );

  if (activeTab === 'needs-alt') {
    allImages = allImages.filter(img => !img.alt_text || img.alt_text.trim() === '');
  } else if (activeTab === 'has-alt') {
    allImages = allImages.filter(img => img.alt_text && img.alt_text.trim() !== '');
  } else if (activeTab === 'to-sync') {
    allImages = allImages.filter(img => img.alt_text && img.alt_text.trim() !== '');
  }

  const totalPages = Math.ceil(allImages.length / IMAGES_PER_PAGE);
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const paginatedImages = allImages.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleSelectAll = () => {
    if (selectedImages.size === paginatedImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(paginatedImages.map(img => img.id)));
    }
  };

  const handleSelectImage = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleGenerateForSelected = () => {
    if (selectedImages.size === 0) {
      addNotification({
        type: 'info',
        title: 'No Selection',
        message: 'Please select images to generate ALT text',
        duration: 3000
      });
      return;
    }

    setConfirmAction('generate');
    setShowConfirm(true);
  };

  const executeGenerateForSelected = async () => {
    setShowConfirm(false);
    const imagesToGenerate = allImages.filter(img =>
      selectedImages.has(img.id) && (!img.alt_text || img.alt_text.trim() === '')
    );

    if (imagesToGenerate.length === 0) {
      addNotification({
        type: 'info',
        title: 'No Action Needed',
        message: 'Selected images already have ALT text',
        duration: 3000
      });
      return;
    }

    setGeneratingSelected(true);
    setIsProcessingComplete(false);
    setProgress({ current: 0, total: imagesToGenerate.length, currentItem: '' });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < imagesToGenerate.length; i++) {
      const image = imagesToGenerate[i];

      setProgress({
        current: i + 1,
        total: imagesToGenerate.length,
        currentItem: `${image.productTitle} - Image ${image.position}`
      });

      try {
        const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-alt-texts`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageId: image.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`Error generating ALT text for image ${image.id}:`, err);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProcessingComplete(true);

    setTimeout(async () => {
      setGeneratingSelected(false);
      setProgress({ current: 0, total: 0, currentItem: '' });
      setSelectedImages(new Set());

      try {
        const refreshUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/refresh-dashboard-cache`;
        await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Error refreshing cache:', err);
      }

      await fetchProductsWithImages();

      addNotification({
        type: 'success',
        title: 'ALT Text Generation Complete',
        message: `Successfully generated ${successCount} ALT texts${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        duration: 5000
      });
    }, 2000);
  };

  const handleSyncSelected = () => {
    const imagesToSync = allImages.filter(img =>
      selectedImages.has(img.id) && img.alt_text && img.alt_text.trim() !== ''
    );

    if (imagesToSync.length === 0) {
      addNotification({
        type: 'info',
        title: 'No Images to Sync',
        message: 'Selected images do not have ALT text to sync',
        duration: 3000
      });
      return;
    }

    setConfirmAction('sync');
    setShowConfirm(true);
  };

  const executeSyncSelected = async () => {
    setShowConfirm(false);
    const imagesToSync = allImages.filter(img =>
      selectedImages.has(img.id) && img.alt_text && img.alt_text.trim() !== ''
    );

    setSyncingSelected(true);
    setIsProcessingComplete(false);
    setProgress({ current: 0, total: imagesToSync.length, currentItem: '' });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < imagesToSync.length; i++) {
      const image = imagesToSync[i];

      setProgress({
        current: i + 1,
        total: imagesToSync.length,
        currentItem: `${image.productTitle} - Image ${image.position}`
      });

      try {
        const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/sync-seo-to-shopify`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageId: image.id, syncAltText: true }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`Error syncing image ${image.id}:`, err);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProcessingComplete(true);

    setTimeout(async () => {
      setSyncingSelected(false);
      setProgress({ current: 0, total: 0, currentItem: '' });
      setSelectedImages(new Set());

      try {
        const refreshUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/refresh-dashboard-cache`;
        await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Error refreshing cache:', err);
      }

      await fetchProductsWithImages();

      addNotification({
        type: 'success',
        title: 'Shopify Sync Complete',
        message: `Successfully synced ${successCount} images${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        duration: 5000
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ALT Image</h2>
            <p className="text-sm text-gray-600 mt-1">
              Génération et gestion des textes alternatifs
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-12 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-green-100 rounded-2xl"></div>
            <div className="absolute inset-2 border-4 border-t-green-500 border-r-emerald-500 rounded-2xl animate-spin" style={{animationDuration: '3s'}}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <ImageIcon className="w-10 h-10 text-green-600 animate-pulse" />
                <Sparkles className="w-4 h-4 text-emerald-500 absolute -top-1 -right-1 animate-ping" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chargement des images...
          </h3>
          <p className="text-gray-600 text-sm">
            Analyse des textes alternatifs
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const totalImages = quickStats?.total_images || allImages.length;
  const imagesWithAlt = quickStats?.images_with_alt || allImages.filter(img => img.alt_text && img.alt_text.trim() !== '').length;
  const imagesNeedingAlt = quickStats?.images_needing_alt || allImages.filter(img => !img.alt_text || img.alt_text.trim() === '').length;

  const tabs = [
    { id: 'all' as AltImageTab, label: 'Toutes les images', count: totalImages },
    { id: 'needs-alt' as AltImageTab, label: 'Sans ALT text', count: imagesNeedingAlt },
    { id: 'has-alt' as AltImageTab, label: 'Avec ALT text', count: imagesWithAlt },
    { id: 'to-sync' as AltImageTab, label: 'À synchroniser', count: imagesWithAlt }
  ];

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />

      <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-7 h-7 text-blue-600" />
          ALT Image Optimization
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const imagesToGenerate = allImages.filter(img => !img.alt_text || img.alt_text.trim() === '');
              if (imagesToGenerate.length === 0) {
                addNotification({
                  type: 'info',
                  title: 'No Action Needed',
                  message: 'All images already have ALT text',
                  duration: 3000
                });
                return;
              }
              setSelectedImages(new Set(imagesToGenerate.map(img => img.id)));
              setConfirmAction('generate');
              setShowConfirm(true);
            }}
            disabled={generatingSelected || imagesNeedingAlt === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition shadow-md"
          >
            <Sparkles className="w-5 h-5" />
            Generate All ALT Text
          </button>
          <button
            onClick={() => {
              const imagesToSync = allImages.filter(img => img.alt_text && img.alt_text.trim() !== '');
              if (imagesToSync.length === 0) {
                addNotification({
                  type: 'info',
                  title: 'No Images to Sync',
                  message: 'No images with ALT text to sync',
                  duration: 3000
                });
                return;
              }
              setSelectedImages(new Set(imagesToSync.map(img => img.id)));
              setConfirmAction('sync');
              setShowConfirm(true);
            }}
            disabled={syncingSelected || imagesWithAlt === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition shadow-md"
          >
            <Upload className="w-5 h-5" />
            Sync All to Shopify
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === tab.id
                ? 'bg-white bg-opacity-20 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-6 h-6 text-gray-600" />
            <h3 className="font-semibold text-gray-700">Total Images</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{allImages.length}</p>
          <p className="text-sm text-gray-500 mt-1">From {products.length} products</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">With ALT Text</h3>
          </div>
          <p className="text-4xl font-bold text-green-900">{imagesWithAlt}</p>
          <p className="text-sm text-green-700 mt-1">Optimized for SEO</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Needs ALT Text</h3>
          </div>
          <p className="text-4xl font-bold text-orange-900">{imagesNeedingAlt}</p>
          <p className="text-sm text-orange-700 mt-1">Requires optimization</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title={confirmAction === 'generate' ? 'Generate ALT Text?' : 'Sync to Shopify?'}
        message={
          confirmAction === 'generate'
            ? `Generate ALT text for ${selectedImages.size} selected images using AI?`
            : `Sync ALT text for ${selectedImages.size} selected images to Shopify?`
        }
        confirmText="Confirm"
        cancelText="Cancel"
        type={confirmAction === 'generate' ? 'info' : 'warning'}
        onConfirm={() => {
          if (confirmAction === 'generate') {
            executeGenerateForSelected();
          } else if (confirmAction === 'sync') {
            executeSyncSelected();
          }
        }}
        onCancel={() => {
          setShowConfirm(false);
          setConfirmAction(null);
        }}
      />

      <ProgressModal
        isOpen={generatingSelected || syncingSelected}
        title={generatingSelected ? 'Generating ALT Text' : 'Syncing to Shopify'}
        current={progress.current}
        total={progress.total}
        currentItem={progress.currentItem}
        itemType="image"
        isComplete={isProcessingComplete}
        onClose={() => {
          if (isProcessingComplete) {
            setGeneratingSelected(false);
            setSyncingSelected(false);
            setIsProcessingComplete(false);
          }
        }}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="Grid View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={fetchProductsWithImages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {selectedImages.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-900 font-medium">
                  {selectedImages.size} images selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateForSelected}
                  disabled={generatingSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
                >
                  {generatingSelected ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate ALT Text
                    </>
                  )}
                </button>
                <button
                  onClick={handleSyncSelected}
                  disabled={syncingSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
                >
                  {syncingSelected ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Sync to Shopify
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedImages(new Set())}
                  className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedImages.size === paginatedImages.length && paginatedImages.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({paginatedImages.length} on page)
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1} - {Math.min(endIndex, allImages.length)} of {allImages.length} images
              </span>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {paginatedImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition ${
                    selectedImages.has(image.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectImage(image.id)}
                >
                  <div className="aspect-square bg-gray-50 relative">
                    <img
                      src={image.src}
                      alt={image.alt_text || `Image ${image.position}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedImages.has(image.id) && (
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-blue-600 rounded-full p-2">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                      #{image.position}
                    </div>
                    {image.alt_text && image.alt_text.trim() !== '' ? (
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        ALT
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        No ALT
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-700 font-medium truncate" title={image.productTitle}>
                      {image.productTitle}
                    </p>
                    {image.alt_text && (
                      <p className="text-xs text-gray-500 truncate mt-1" title={image.alt_text}>
                        {image.alt_text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedImages.map((image) => (
                <div
                  key={image.id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition ${
                    selectedImages.has(image.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectImage(image.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.id)}
                    onChange={() => handleSelectImage(image.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt_text || `Image ${image.position}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {image.productTitle}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        Position #{image.position}
                      </span>
                    </div>
                    {image.alt_text && image.alt_text.trim() !== '' ? (
                      <p className="text-sm text-gray-600 line-clamp-2">{image.alt_text}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No ALT text</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {image.alt_text && image.alt_text.trim() !== '' ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Has ALT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Needs ALT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {allImages.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No images found</p>
            <p className="text-sm text-gray-500 mt-1">
              Import products with images to get started
            </p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
