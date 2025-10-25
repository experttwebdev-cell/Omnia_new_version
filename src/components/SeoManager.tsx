import { useState } from 'react';
import { FileText, Image as ImageIcon, Lightbulb, Tag as TagIcon, BookOpen, FileEdit, Sparkles } from 'lucide-react';
import { SeoOptimization } from './SeoOptimization';
import { SeoAltImage } from './SeoAltImage';
import { SeoTag } from './SeoTag';
import { SeoOpportunities } from './SeoOpportunities';
import { BlogArticles } from './BlogArticles';
import { AiBlogWriter } from './AiBlogWriter';

type SeoTab = 'optimization' | 'alt-image' | 'tag' | 'opportunities' | 'articles' | 'ai-blog';

interface TabConfig {
  id: SeoTab;
  name: string;
  icon: React.ElementType;
  description: string;
  isSubItem?: boolean;
  section: 'seo' | 'opportunity';
}

export function SeoManager() {
  const [activeTab, setActiveTab] = useState<SeoTab>('optimization');

  const tabs: TabConfig[] = [
    {
      id: 'optimization' as SeoTab,
      name: 'Optimisation',
      icon: FileText,
      description: 'Titre SEO et Méta Description',
      isSubItem: true,
      section: 'seo'
    },
    {
      id: 'alt-image' as SeoTab,
      name: 'ALT Image',
      icon: ImageIcon,
      description: 'Gestion des textes alternatifs',
      isSubItem: true,
      section: 'seo'
    },
    {
      id: 'tag' as SeoTab,
      name: 'Tags',
      icon: TagIcon,
      description: 'Gestion des tags produits',
      isSubItem: true,
      section: 'seo'
    },
    {
      id: 'opportunities' as SeoTab,
      name: 'Opportunités',
      icon: Lightbulb,
      description: 'Idées de création de contenu',
      isSubItem: true,
      section: 'seo'
    },
    {
      id: 'articles' as SeoTab,
      name: 'Article de Blog',
      icon: BookOpen,
      description: 'Gestion des articles de blog',
      isSubItem: true,
      section: 'seo'
    },
    {
      id: 'ai-blog' as SeoTab,
      name: 'AI Blog Writer',
      icon: Sparkles,
      description: 'Génération automatique d\'articles',
      isSubItem: true,
      section: 'seo'
    }
  ];

  const seoTabs = tabs.filter(t => t.section === 'seo');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">SEO Management</h1>
        <p className="text-gray-600">Optimize your products for search engines and manage content</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">SEO</h2>
          </div>

          <div className="flex border-b border-gray-200 overflow-x-auto">
            {seoTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className={`text-xs font-normal ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'optimization' && <SeoOptimization />}
          {activeTab === 'alt-image' && <SeoAltImage />}
          {activeTab === 'tag' && <SeoTag />}
          {activeTab === 'opportunities' && <SeoOpportunities />}
          {activeTab === 'articles' && <BlogArticles />}
          {activeTab === 'ai-blog' && <AiBlogWriter />}
        </div>
      </div>
    </div>
  );
}
