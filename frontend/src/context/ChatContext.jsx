import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { guestId, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [latestObservability, setLatestObservability] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Load conversation list
  const refreshConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      const list = data.results || data || [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    }
  }, []);

  // Reload conversations when user or guestId changes
  useEffect(() => {
    if (guestId || user) {
      refreshConversations().then(list => {
        if (list.length > 0 && !activeConversationId) {
          setActiveConversationId(list[0].id);
        }
      });
    }
  }, [guestId, user, refreshConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadActiveMessages() {
      setLoadingMessages(true);
      try {
        const conv = await api.getConversation(activeConversationId);
        setMessages(conv.messages || []);
      } catch (err) {
        console.error('Failed to load active conversation messages:', err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadActiveMessages();
  }, [activeConversationId]);

  // Create new conversation
  const startNewConversation = async () => {
    try {
      const newConv = await api.createConversation('New Conversation');
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      return newConv;
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Rename or Pin conversation
  const updateConversationMeta = async (id, updates) => {
    try {
      const updated = await api.updateConversation(id, updates);
      setConversations(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
    } catch (err) {
      console.error('Failed to update conversation:', err);
    }
  };

  // Send message
  const sendMessage = async (queryText) => {
    if (!queryText || !queryText.trim() || sending) return;
    const cleanText = queryText.trim();
    setSending(true);

    // Optimistic User Message
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: cleanText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendMessage(cleanText, activeConversationId);
      const { conversation_id, conversation_title, user_message, assistant_message, observability } = res;

      // Update active conversation ID if newly created
      if (!activeConversationId || activeConversationId !== conversation_id) {
        setActiveConversationId(conversation_id);
      }

      // Replace temp user msg and append assistant msg
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, user_message, assistant_message];
      });

      // Update conversation list
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation_id);
        if (exists) {
          return prev.map(c => c.id === conversation_id ? { ...c, title: conversation_title || c.title, updated_at: new Date().toISOString() } : c);
        } else {
          return [{ id: conversation_id, title: conversation_title, message_count: 2, created_at: new Date().toISOString() }, ...prev];
        }
      });

      setLatestObservability(observability);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Append error message from assistant
      const errorAssistantMsg = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Error Processing Request**: ${err.data?.error || err.message || 'Unable to reach the AI server.'}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorAssistantMsg]);
    } finally {
      setSending(false);
    }
  };

  // Submit Feedback
  const recordFeedback = async (messageId, ratingType, stars, tags, comment) => {
    try {
      const res = await api.submitFeedback(messageId, ratingType, stars, tags, comment);
      // Update message feedback in state
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, feedback: res.feedback };
        }
        return m;
      }));
      return res;
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      throw err;
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.title?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <ChatContext.Provider
      value={{
        conversations: filteredConversations,
        allConversations: conversations,
        activeConversationId,
        activeConversation: conversations.find(c => c.id === activeConversationId),
        messages,
        loadingMessages,
        sending,
        latestObservability,
        searchFilter,
        setSearchFilter,
        setActiveConversationId,
        startNewConversation,
        deleteConversation,
        updateConversationMeta,
        sendMessage,
        recordFeedback,
        refreshConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
