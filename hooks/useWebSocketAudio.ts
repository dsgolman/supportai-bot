// hooks/useWebsocketAudio.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface WebsocketAudioHook {
  initializeChat: (resumeChatGroupId?: string | null) => Promise<string | null>;
  sendMessage: (message: string, type: 'text' | 'audio', audioUrl?: string) => Promise<void>;
  closeChat: () => Promise<void>;
  chatStatus: string;
  chatGroupId: string | null;
  error: string | null;
  isAIAudioEnabled: boolean;
  toggleAIAudio: () => void;
  sendAudioToAI: (audioData: Float32Array) => void;
  aiAudioStream: MediaStream | null;
  isChatStarted: boolean;
  startChat: () => Promise<void>;
}

export function useWebsocketAudio(groupId: string, userId: string): WebsocketAudioHook {
  const [chatStatus, setChatStatus] = useState<string>('disconnected');
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAIAudioEnabled, setIsAIAudioEnabled] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const aiAudioStreamRef = useRef<MediaStream | null>(null);
  const supabase = createClient();

  const handleAIResponse = useCallback(async (response: any) => {
    if (response.type === 'text') {
      await sendMessage(response.content, 'text');
    } else if (response.type === 'audio') {
      console.log('Received audio response from AI');
      // Implement audio playback or processing here
    }
  }, []);

  const initializeChat = useCallback(async (resumeChatGroupId?: string | null): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, resume_chat_group_id: resumeChatGroupId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }

      const data = await response.json();
      setChatGroupId(data.chatGroupId);
      setChatStatus('connected');
      setIsChatStarted(true);
      return data.chatGroupId;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [groupId]);

  const sendMessage = useCallback(async (message: string, type: 'text' | 'audio', audioUrl?: string) => {
    if (!chatGroupId) {
      setError('Chat not initialized');
      return;
    }

    try {
      await supabase.from('messages').insert({
        group_id: groupId,
        message: message,
        type: type,
        audio_url: audioUrl,
        user_id: userId,
      });
    } catch (err) {
      setError('Failed to send message');
    }
  }, [groupId, chatGroupId, supabase, userId]);

  const closeChat = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat?groupId=${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to close chat');
      }

      setChatStatus('disconnected');
      setChatGroupId(null);
      setIsChatStarted(false);
    } catch (err) {
      setError(err.message);
    }
  }, [groupId]);

  const toggleAIAudio = useCallback(() => {
    setIsAIAudioEnabled(prev => !prev);
  }, []);

  const sendAudioToAI = useCallback((audioData: Float32Array) => {
    if (chatStatus === 'connected') {
      sendMessage('', 'audio', URL.createObjectURL(new Blob([audioData], { type: 'audio/wav' })));
    }
  }, [chatStatus, sendMessage]);

  const startChat = useCallback(async () => {
    if (!isChatStarted) {
      await initializeChat();
    }
  }, [isChatStarted, initializeChat]);

  useEffect(() => {
    const fetchChatStatus = async () => {
      try {
        const response = await fetch(`/api/chat?groupId=${groupId}`);
        if (response.ok) {
          const data = await response.json();
          setChatStatus(data.status);
          setChatGroupId(data.chat_group_id);
          setIsChatStarted(data.status === 'connected');
        }
      } catch (err) {
        setError('Failed to fetch chat status');
      }
    };

    fetchChatStatus();

    const channel = supabase
      .channel(`realtime-chat-status-${groupId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_connections', filter: `group_id=eq.${groupId}` }, 
        (payload) => {
          setChatStatus(payload.new.status);
          setChatGroupId(payload.new.chat_group_id);
          setIsChatStarted(payload.new.status === 'connected');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase]);

  return {
    initializeChat,
    sendMessage,
    closeChat,
    chatStatus,
    chatGroupId,
    error,
    isAIAudioEnabled,
    toggleAIAudio,
    sendAudioToAI,
    aiAudioStream: aiAudioStreamRef.current,
    isChatStarted,
    startChat,
  };
}