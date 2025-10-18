import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Search,
  Trash2,
  Pin,
  PinOff,
  Edit2,
  Check,
  X,
  Download,
  Clock,
  Tag as TagIcon
} from 'lucide-react';
import {
  listConversations,
  deleteConversation,
  togglePinConversation,
  updateConversationTitle,
  searchConversations,
  exportConversation,
  setCurrentConversationId,
  type ChatConversation
} from '../lib/chatHistory';

interface ChatHistoryProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  currentConversationId?: string;
}

export function ChatHistory({ onSelectConversation, currentConversationId }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    const data = await listConversations();
    setConversations(data);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchConversations(query);
      setConversations(results);
    } else {
      await loadConversations();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette conversation ?')) {
      await deleteConversation(id);
      await loadConversations();
    }
  };

  const handlePin = async (id: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePinConversation(id, !isPinned);
    await loadConversations();
  };

  const handleEdit = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await updateConversationTitle(id, editTitle);
      await loadConversations();
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleExport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const exported = await exportConversation(id);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSelect = (conversation: ChatConversation) => {
    setCurrentConversationId(conversation.id);
    onSelectConversation(conversation);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher dans l'historique..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation enregistrée'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                  currentConversationId === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveEdit(conv.id, e)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-medium text-gray-900 text-sm truncate flex items-center gap-2">
                        {conv.is_pinned && <Pin className="w-3 h-3 text-blue-600 flex-shrink-0" />}
                        {conv.title}
                      </h3>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handlePin(conv.id, conv.is_pinned, e)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title={conv.is_pinned ? 'Détacher' : 'Épingler'}
                    >
                      {conv.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleEdit(conv.id, conv.title, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Renommer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleExport(conv.id, e)}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Exporter"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {conv.message_count} message{conv.message_count > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(conv.last_message_at)}
                  </span>
                </div>

                {conv.tags && conv.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {conv.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
