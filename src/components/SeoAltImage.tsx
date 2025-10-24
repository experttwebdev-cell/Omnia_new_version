import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import { 
  Search, RefreshCw, Image as ImageIcon, Sparkles, Upload, 
  Loader2, Package, CheckCircle, Clock, Check, Grid3x3, List,
  Filter, Download, Upload as UploadIcon, Settings,
  Eye, Edit3, Trash2, ZoomIn, ExternalLink
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { ProgressModal } from './ProgressModal';
import { ConfirmDialog } from './ConfirmDialog';
import { useNotifications, NotificationSystem } from './NotificationSystem';
import { ImagePreviewModal } from './ImagePreviewModal';
import { BulkActions } from './BulkActions';
import { ImageFilters } from './ImageFilters';
import { ExportModal } from './ExportModal';

type Product = Database['public']['Tables']['shopify_products']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductWithImages extends Product {
  images: ProductImage[];
}

type AltImageTab = 'all' | 'needs-alt' | 'has-alt' | 'to-sync';
type SortField = 'product_title' | 'position' | 'alt_text' | 'updated_at';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  vendors: string[];
  categories: string[];
  shops: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export function SeoAltImage() {
  // State management
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
  const [confirmAction, setConfirmAction] = useState<'generate' | 'sync' | 'delete' | null>(null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>({
    vendors: [],
    categories: [],
    shops: [],
    dateRange: { start: null, end: null }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);
  const [editingAltText, setEditingAltText] = useState<{ id: string; text: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  const IMAGES_PER_PAGE = 50;

  // Memoized data processing
  const { allImages, filteredImages, availableFilters } = useMemo(() => {
    let images = products.flatMap(p =>
      p.images.map(img => ({
        ...img,
        productTitle: p.title,
        productId: p.id,
        productVendor: p.vendor,
        productCategory: p.category,
        shopName: p.shop_name,
        product: p
      }))
    );

    // Apply tab filters
    if (activeTab === 'needs-alt') {
      images = images.filter(img => !img.alt_text || img.alt_text.trim() === '');
    } else if (activeTab === 'has-alt') {
      images = images.filter(img => img.alt_text && img.alt_text.trim() !== '');
    } else if (activeTab === 'to-sync') {
      images = images.filter(img => img.alt_text && img.alt_text.trim() !== '');
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      images = images.filter(img => 
        img.productTitle.toLowerCase().includes(term) ||
        img.alt_text?.toLowerCase().includes(term) ||
        img.productVendor?.toLowerCase().includes(term)
      );
    }

    // Apply custom filters
    if (filters.vendors.length > 0) {
      images = images.filter(img => filters.vendors.includes(img.productVendor || ''));
    }
    if (filters.categories.length > 0) {
      images = images.filter(img => filters.categories.includes(img.productCategory || ''));
    }
    if (filters.shops.length > 0) {
      images = images.filter(img => filters.shops.includes(img.shopName || ''));
    }
    if (filters.dateRange.start || filters.dateRange.end) {
      images = images.filter(img => {
        const imgDate = new Date(img.updated_at || img.created_at);
        if (filters.dateRange.start && imgDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && imgDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // Sort images
    images.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'product_title') {
        aValue = a.productTitle;
        bValue = b.productTitle;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Extract available filter options
    const vendors = [...new Set(products.map(p => p.vendor).filter(Boolean))];
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const shops = [...new Set(products.map(p => p.shop_name).filter(Boolean))];

    return {
      allImages: images,
      filteredImages: images,
      availableFilters: { vendors, categories, shops }
    };
  }, [products, activeTab, searchTerm, filters, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const paginatedImages = filteredImages.slice(startIndex, endIndex);

  // Data fetching
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
        .select('*')
        .order('imported_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .order('position', { ascending: true });

      if (imagesError) throw imagesError;

      const productMap = new Map<string, ProductWithImages>();
      (productsData || []).forEach((prod) => {
        productMap.set(prod.id, { ...prod, images: [] } as ProductWithImages);
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

  // Utility functions
  const refreshCache = async () => {
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
  };

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

  // ALT Text Operations
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
    const imagesToGenerate = filteredImages.filter(img =>
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
    await handleProcessComplete(successCount, errorCount, 'generate');
  };

  // Sync Operations
  const handleSyncSelected = () => {
    const imagesToSync = filteredImages.filter(img =>
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
    const imagesToSync = filteredImages.filter(img =>
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
    await handleProcessComplete(successCount, errorCount, 'sync');
  };

  const handleProcessComplete = async (successCount: number, errorCount: number, action: 'generate' | 'sync') => {
    setTimeout(async () => {
      setGeneratingSelected(false);
      setSyncingSelected(false);
      setProgress({ current: 0, total: 0, currentItem: '' });
      setSelectedImages(new Set());

      await refreshCache();
      await fetchProductsWithImages();

      addNotification({
        type: successCount > 0 ? 'success' : 'error',
        title: action === 'generate' ? 'ALT Text Generation Complete' : 'Shopify Sync Complete',
        message: `Successfully processed ${successCount} images${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        duration: 5000
      });
    }, 2000);
  };

  // Manual ALT Text Editing
  const handleEditAltText = async (imageId: string, newAltText: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ alt_text: newAltText, updated_at: new Date().toISOString() })
        .eq('id', imageId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'ALT Text Updated',
        message: 'ALT text has been updated successfully',
        duration: 3000
      });

      setEditingAltText(null);
      await fetchProductsWithImages();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update ALT text',
        duration: 5000
      });
    }
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
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
    { id: 'all' as AltImageTab, label: 'Toutes les images', count: totalImages, color: 'gray' },
    { id: 'needs-alt' as AltImageTab, label: 'Sans ALT text', count: imagesNeedingAlt, color: 'orange' },
    { id: 'has-alt' as AltImageTab, label: 'Avec ALT text', count: imagesWithAlt, color: 'green' },
    { id: 'to-sync' as AltImageTab, label: 'À synchroniser', count: imagesWithAlt, color: 'blue' }
  ];

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
      <ImagePreviewModal 
        image={previewImage} 
        onClose={() => setPreviewImage(null)}
        onEdit={(image) => setEditingAltText({ id: image.id, text: image.alt_text || '' })}
      />
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        images={filteredImages}
      />

      <div className="animate-fadeIn space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-7 h-7 text-blue-600" />
              ALT Image Optimization
            </h2>
            <p className="text-gray-600 mt-1">
              Manage and optimize ALT text for {totalImages} images across {products.length} products
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={fetchProductsWithImages}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition hover:shadow-md ${
                activeTab === tab.id ? `border-${tab.color}-500 ring-2 ring-${tab.color}-100` : 'border-gray-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{tab.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{tab.count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full bg-${tab.color}-500`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        <BulkActions
          selectedCount={selectedImages.size}
          onGenerate={handleGenerateForSelected}
          onSync={handleSyncSelected}
          onClearSelection={() => setSelectedImages(new Set())}
          isGenerating={generatingSelected}
          isSyncing={syncingSelected}
          totalImages={filteredImages.length}
        />

        {/* Controls Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and View Controls */}
            <div className="flex flex-1 items-center gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none lg:w-80 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, ALT text, vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                    showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {Object.values(filters).some(filter => 
                    Array.isArray(filter) ? filter.length > 0 : filter.start || filter.end
                  ) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="product_title">Product Name</option>
                <option value="position">Position</option>
                <option value="alt_text">ALT Text</option>
                <option value="updated_at">Last Updated</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <ImageFilters
              filters={filters}
              availableFilters={availableFilters}
              onChange={setFilters}
              onClear={() => setFilters({ vendors: [], categories: [], shops: [], dateRange: { start: null, end: null } })}
            />
          )}
        </div>

        {/* Images Grid/List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
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
                  {selectedImages.size > 0 
                    ? `${selectedImages.size} selected` 
                    : `Select All (${paginatedImages.length} on page)`
                  }
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1} - {Math.min(endIndex, filteredImages.length)} of {filteredImages.length} images
              </span>
            </div>
          </div>

          {/* Images Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {paginatedImages.map((image) => (
                <ImageGridCard
                  key={image.id}
                  image={image}
                  isSelected={selectedImages.has(image.id)}
                  onSelect={handleSelectImage}
                  onPreview={setPreviewImage}
                  onEdit={setEditingAltText}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedImages.map((image) => (
                <ImageListItem
                  key={image.id}
                  image={image}
                  isSelected={selectedImages.has(image.id)}
                  onSelect={handleSelectImage}
                  onPreview={setPreviewImage}
                  onEdit={setEditingAltText}
                  isEditing={editingAltText?.id === image.id}
                  onSaveEdit={handleEditAltText}
                  onCancelEdit={() => setEditingAltText(null)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredImages.length === 0 && (
            <div className="text-center py-12 bg-gray-50">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No images found matching your criteria</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
    </>
  );
}

// Sub-components for better organization
interface ImageCardProps {
  image: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (image: any) => void;
  onEdit: (edit: { id: string; text: string }) => void;
}

const ImageGridCard: React.FC<ImageCardProps> = ({ image, isSelected, onSelect, onPreview, onEdit }) => (
  <div
    className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
      isSelected
        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}
    onClick={() => onSelect(image.id)}
  >
    <div className="aspect-square bg-gray-50 relative group">
      <img
        src={image.src}
        alt={image.alt_text || `Image ${image.position}`}
        className="w-full h-full object-cover"
      />
      
      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
          <div className="bg-blue-600 rounded-full p-2">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Action Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(image);
            }}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          {image.alt_text && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit({ id: image.id, text: image.alt_text });
              }}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
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
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-400">{image.productVendor}</span>
        <span className="text-xs text-gray-400">{image.shopName}</span>
      </div>
    </div>
  </div>
);

interface ImageListItemProps extends ImageCardProps {
  isEditing: boolean;
  onSaveEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
}

const ImageListItem: React.FC<ImageListItemProps> = ({
  image,
  isSelected,
  onSelect,
  onPreview,
  onEdit,
  isEditing,
  onSaveEdit,
  onCancelEdit
}) => {
  const [editText, setEditText] = useState(image.alt_text || '');

  const handleSave = () => {
    if (editText.trim() !== image.alt_text) {
      onSaveEdit(image.id, editText.trim());
    } else {
      onCancelEdit();
    }
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={() => onSelect(image.id)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(image.id)}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      
      <div 
        className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in"
        onClick={(e) => {
          e.stopPropagation();
          onPreview(image);
        }}
      >
        <img
          src={image.src}
          alt={image.alt_text || `Image ${image.position}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
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
        
        <div className="flex items-center gap-2 mb-2">
          {image.productVendor && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {image.productVendor}
            </span>
          )}
          {image.shopName && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {image.shopName}
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter ALT text..."
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : image.alt_text && image.alt_text.trim() !== '' ? (
          <p className="text-sm text-gray-600 line-clamp-2">{image.alt_text}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No ALT text</p>
        )}
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-2">
        {!isEditing && image.alt_text && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit({ id: image.id, text: image.alt_text });
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
        
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
  );
};