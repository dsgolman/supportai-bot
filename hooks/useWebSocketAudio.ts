import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface WebSocketMessage {
  type: 'chat_metadata' | 'assistant_message' | 'audio_output';
  payload: any;
}

interface WebsocketAudioHook {
  initializeChat: (resumeChatGroupId?: string | null) => Promise<string | null>;
  sendUserInput: (input: string | Float32Array) => Promise<void>;
  closeChat: () => Promise<void>;
  chatStatus: string;
  chatGroupId: string | null;
  error: string | null;
  isAIAudioEnabled: boolean;
  toggleAIAudio: () => void;
  aiAudioStream: MediaStream | null;
  isChatStarted: boolean;
  startChat: () => Promise<void>;
  assistantMessage: string | null;
  audioOutput: Blob | null;
}

export function useWebSocketAudio(groupId: string, userId: string): WebsocketAudioHook {
  const [chatStatus, setChatStatus] = useState<string>('disconnected');
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAIAudioEnabled, setIsAIAudioEnabled] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [audioOutput, setAudioOutput] = useState<Blob | null>(null);
  const aiAudioStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const supabase = createClient();

  const initializeChat = useCallback(async (resumeChatGroupId?: string | null): Promise<string | null> => {
    try {
      const newChatGroupId = resumeChatGroupId || crypto.randomUUID();
      
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('config_id')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      if (!groupData?.config_id) throw new Error('Group configuration not found');

      const { data, error } = await supabase
        .from('chat_connections')
        .upsert({
          group_id: groupId,
          chat_group_id: newChatGroupId,
          status: 'connecting',
        }, {
          onConflict: 'group_id',
        })
        .select()
        .single();

      if (error) throw error;

      setChatGroupId(newChatGroupId);
      setIsChatStarted(true);

      await connectWebSocket(newChatGroupId, groupData.config_id);

      return newChatGroupId;
    } catch (err: unknown) {
      console.error('[initializeChat] Error during chat initialization:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during chat initialization');
      }
      return null;
    }
  }, [groupId, supabase]);

  const connectWebSocket = useCallback(async (chatGroupId: string, configId: string) => {
    const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'wss';
    const wsUrl = `${wsProtocol}://api.hume.ai/v0/evi/chat?apiKey=aEAM4ZfdVaWTJkcZame7evZmjfGhKYxvhj0I5E7Lg8pYhd5c&config_id=${configId}&resumed_chat_group_id=${chatGroupId}`;
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      setChatStatus('connected');
      void updateChatStatus('connected');
    };

    websocketRef.current.onmessage = handleWebSocketMessage;

    websocketRef.current.onerror = (event) => {
      console.error('[connectWebSocket] WebSocket error:', event);
      setError('WebSocket connection error');
      void updateChatStatus('error');
    };

    websocketRef.current.onclose = () => {
      setChatStatus('disconnected');
      void updateChatStatus('disconnected');
    };
  }, []);

  const updateChatStatus = useCallback(async (status: string) => {
    try {
      await supabase
        .from('chat_connections')
        .update({ status })
        .eq('group_id', groupId);
    } catch (err) {
      console.error('[updateChatStatus] Failed to update chat status:', err);
    }
  }, [groupId, supabase]);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    const data: WebSocketMessage = JSON.parse(event.data);
    switch (data.type) {
      case 'chat_metadata':
        console.log('Received chat metadata:', data.payload);
        break;
      case 'assistant_message':
        setAssistantMessage(data.payload);
        break;
      case 'audio_output':
        const audioBlob = new Blob([data.payload], { type: 'audio/wav' });
        setAudioOutput(audioBlob);
        if (isAIAudioEnabled) {
          void playAIAudio(audioBlob);
        }
        break;
      default:
        console.warn('Unhandled WebSocket message type:', data.type);
    }
  }, [isAIAudioEnabled]);

  const sendUserInput = useCallback(async (input: string | Float32Array) => {
    if (!chatGroupId) {
      setError('Chat not initialized');
      return;
    }

    try {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        const messageType = typeof input === 'string' ? 'user_input' : 'audio_input';
        websocketRef.current.send(JSON.stringify({ type: messageType, payload: input }));

        await supabase.from('messages').insert({
          group_id: groupId,
          message: typeof input === 'string' ? input : 'Audio input',
          type: messageType,
          user_id: userId,
        });
      } else {
        setError('WebSocket is not connected');
      }
    } catch (err) {
      console.error('[sendUserInput] Failed to send input:', err);
      setError('Failed to send input');
    }
  }, [groupId, chatGroupId, supabase, userId]);

  const closeChat = useCallback(async () => {
    try {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.close();
      }
      websocketRef.current = null;

      setChatStatus('disconnected');
      setChatGroupId(null);
      setIsChatStarted(false);

      await updateChatStatus('disconnected');

      await supabase
        .from('group_turns')
        .update({
          current_user_id: null,
          queue: [],
          turn_start_time: null
        })
        .eq('group_id', groupId);

    } catch (err) {
      console.error('[closeChat] Error closing chat:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while closing the chat');
      }
    }
  }, [groupId, updateChatStatus, supabase]);

  const toggleAIAudio = useCallback(() => {
    setIsAIAudioEnabled(prev => !prev);
  }, []);

  const startChat = useCallback(async () => {
    if (!isChatStarted) {
      await initializeChat();
    }
  }, [isChatStarted, initializeChat]);

  const playAIAudio = useCallback(async (audioBlob: Blob) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    try {
      await audio.play();
    } catch (error) {
      console.error('[playAIAudio] Error playing audio:', error);
      setError('Failed to play AI audio');
    }
  }, []);

  useEffect(() => {
    const fetchChatStatus = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('config_id')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        if (!groupData?.config_id) throw new Error('Group configuration not found');

        const { data, error } = await supabase
          .from('chat_connections')
          .select('status, chat_group_id')
          .eq('group_id', groupId)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') {
            // No existing chat connection found, set default values
            setChatStatus('disconnected');
            setChatGroupId(null);
            setIsChatStarted(false);
          } else {
            throw error;
          }
        } else if (data) {
          // Existing chat connection found
          setChatStatus(data.status);
          setChatGroupId(data.chat_group_id);
          setIsChatStarted(data.status === 'connected');

          if (data.status === 'connected' && !websocketRef.current) {
            await connectWebSocket(data.chat_group_id, groupData.config_id);
          }
        }
      } catch (err) {
        console.error('[fetchChatStatus] Failed to fetch chat status:', err);
        setError('Failed to fetch chat status');
      }
    };

    void fetchChatStatus();

    const channel = supabase
      .channel(`realtime-chat-status-${groupId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_connections', filter: `group_id=eq.${groupId}` }, 
        async (payload) => {
          setChatStatus(payload.new.status);
          setChatGroupId(payload.new.chat_group_id);
          setIsChatStarted(payload.new.status === 'connected');

          if (payload.new.status === 'connected' && !websocketRef.current) {
            const { data: groupData } = await supabase
              .from('groups')
              .select('config_id')
              .eq('id', groupId)
              .single();

            if (groupData?.config_id) {
              await connectWebSocket(payload.new.chat_group_id, groupData.config_id);
            } else {
              console.error('[realtimeSubscription] Failed to fetch config_id for reconnection');
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.close();
      }
      websocketRef.current = null;
    };
  }, [groupId, supabase, connectWebSocket]);

  return {
    initializeChat,
    sendUserInput,
    closeChat,
    chatStatus,
    chatGroupId,
    error,
    isAIAudioEnabled,
    toggleAIAudio,
    aiAudioStream: aiAudioStreamRef.current,
    isChatStarted,
    startChat,
    assistantMessage,
    audioOutput,
  };
}