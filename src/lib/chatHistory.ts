import { supabase } from "./supabase";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  products?: any[];
}

export interface ChatConversation {
  id: string;
  store_id?: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
  is_pinned: boolean;
  tags: string[];
}

export interface ChatSettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
  autoSave?: boolean;
  showTimestamps?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

const CURRENT_CONVERSATION_KEY = 'current_conversation_id';
const CHAT_SETTINGS_KEY = 'chat_settings';

export async function createConversation(
  storeId?: string,
  initialMessage?: ChatMessage
): Promise<ChatConversation | null> {
  try {
    const messages = initialMessage ? [initialMessage] : [];
    const title = initialMessage
      ? generateTitle(initialMessage.content)
      : 'Nouvelle Conversation';

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        store_id: storeId,
        title,
        messages,
        message_count: messages.length,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    localStorage.setItem(CURRENT_CONVERSATION_KEY, data.id);
    return data;
  } catch (error) {
    console.error('Error in createConversation:', error);
    return null;
  }
}

export async function saveMessage(
  conversationId: string,
  message: ChatMessage
): Promise<boolean> {
  try {
    const { data: conversation, error: fetchError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (fetchError || !conversation) {
      console.error('Error fetching conversation:', fetchError);
      return false;
    }

    const updatedMessages = [...(conversation.messages || []), message];

    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({
        messages: updatedMessages,
        message_count: updatedMessages.length,
        last_message_at: new Date().toISOString(),
        title: conversation.message_count === 0 ? generateTitle(message.content) : conversation.title
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveMessage:', error);
    return false;
  }
}

export async function getConversation(conversationId: string): Promise<ChatConversation | null> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getConversation:', error);
    return null;
  }
}

export async function listConversations(
  storeId?: string,
  limit: number = 50
): Promise<ChatConversation[]> {
  try {
    let query = supabase
      .from('chat_conversations')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing conversations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listConversations:', error);
    return [];
  }
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }

    const currentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);
    if (currentId === conversationId) {
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return false;
  }
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateConversationTitle:', error);
    return false;
  }
}

export async function togglePinConversation(
  conversationId: string,
  isPinned: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_pinned: isPinned })
      .eq('id', conversationId);

    if (error) {
      console.error('Error toggling pin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in togglePinConversation:', error);
    return false;
  }
}

export async function addTagsToConversation(
  conversationId: string,
  tags: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ tags })
      .eq('id', conversationId);

    if (error) {
      console.error('Error adding tags:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addTagsToConversation:', error);
    return false;
  }
}

export async function searchConversations(
  searchQuery: string,
  storeId?: string
): Promise<ChatConversation[]> {
  try {
    let query = supabase
      .from('chat_conversations')
      .select('*')
      .or(`title.ilike.%${searchQuery}%,messages::text.ilike.%${searchQuery}%`)
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching conversations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchConversations:', error);
    return [];
  }
}

export function getCurrentConversationId(): string | null {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
}

export function setCurrentConversationId(conversationId: string): void {
  localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
}

export function clearCurrentConversation(): void {
  localStorage.removeItem(CURRENT_CONVERSATION_KEY);
}

export function saveChatSettings(settings: ChatSettings): void {
  localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(settings));
}

export function getChatSettings(): ChatSettings {
  const settingsStr = localStorage.getItem(CHAT_SETTINGS_KEY);
  if (settingsStr) {
    try {
      return JSON.parse(settingsStr);
    } catch (error) {
      console.error('Error parsing chat settings:', error);
    }
  }

  return {
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4000,
    language: 'fr',
    autoSave: true,
    showTimestamps: false,
    theme: 'auto'
  };
}

function generateTitle(firstMessage: string): string {
  const maxLength = 50;
  const cleaned = firstMessage.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.substring(0, maxLength - 3) + '...';
}

export async function exportConversation(conversationId: string): Promise<string | null> {
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    return JSON.stringify(conversation, null, 2);
  } catch (error) {
    console.error('Error exporting conversation:', error);
    return null;
  }
}

export async function clearAllConversations(storeId?: string): Promise<boolean> {
  try {
    let query = supabase.from('chat_conversations').delete();

    if (storeId) {
      query = query.eq('store_id', storeId);
    } else {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { error } = await query;

    if (error) {
      console.error('Error clearing conversations:', error);
      return false;
    }

    clearCurrentConversation();
    return true;
  } catch (error) {
    console.error('Error in clearAllConversations:', error);
    return false;
  }
}
