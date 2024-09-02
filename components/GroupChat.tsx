"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Mic, MicOff } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { VoiceEvent, VoiceClientAudio } from 'realtime-ai';
import { useVoiceClient, useVoiceClientEvent, useVoiceClientMediaTrack } from 'realtime-ai-react';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  group_id: string;
  audio_url?: string;
}

interface GroupChatProps {
  groupId: string;
  userId: string;
  isFirstUser: boolean;
}

export function GroupChat({ groupId, userId, isFirstUser }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceClient = useVoiceClient()!;
  const localAudioTrack = useVoiceClientMediaTrack("audio", "local");
  const botAudioTrack = useVoiceClientMediaTrack("audio", "bot");

  const supabase = createClient();

  useVoiceClientEvent(
    VoiceEvent.BotStartedSpeaking,
    (p) => {
      startBotRecording();
    }
  );

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    (p) => {
      stopBotRecording();
    }
  );

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`group_${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [groupId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prevChunks => [...prevChunks, event.data]);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        console.log("stopping");
        if (recordedChunks.length > 0) {
          const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
          const audioUrl = await uploadAudioToSupabase(audioBlob);

          if (audioUrl) {
            await sendMessage(null, audioUrl);
          }
          setRecordedChunks([]);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadAudioToSupabase = async (audioBlob: Blob) => {
    const fileName = `${userId}/${groupId}/${uuidv4()}.webm`;
    console.log(`Uploading audio with fileName: ${fileName}`);

    const { data, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBlob);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const audioUrl = supabase.storage.from('audio').getPublicUrl(fileName).publicURL;
    console.log('Uploaded audio URL:', audioUrl);
    return audioUrl;
  };

  const sendMessage = async (content: string | null, audioUrl: string | null) => {
    if (content === null && audioUrl === null) return;

    const newMessage = {
      id: uuidv4(),
      user_id: userId,
      content: content || '',
      created_at: new Date().toISOString(),
      group_id: groupId,
      audio_url: audioUrl || '',
    };

    const { error } = await supabase.from('messages').insert([newMessage]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setNewMessage('');
    }
  };

  const startBotRecording = () => {
    console.log("here");
    console.log(botAudioTrack)
    if (!botAudioTrack) return;

    const stream = new MediaStream([botAudioTrack]);
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prevChunks => [...prevChunks, event.data]);
      }
    };

    mediaRecorder.onstop = async () => {
      if (recordedChunks.length > 0) {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        const audioUrl = await uploadAudioToSupabase(audioBlob);

        if (audioUrl) {
          await sendMessage(null, audioUrl);
        }
        setRecordedChunks([]);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  };

  const stopBotRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await sendMessage(newMessage, null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
           ' ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea>
          <div style={{ height: '300px', overflowY: 'scroll' }}>
            {messages.map((message) => (
              <div key={message.id} style={{ marginBottom: '10px' }}>
                <div>
                  <Avatar>
                    <AvatarFallback>{message.user_id[0]}</AvatarFallback>
                  </Avatar>
                  <span>{message.user_id}</span>
                </div>
                <div>{message.content}</div>
                {message.audio_url && (
                  <audio controls src={message.audio_url} style={{ width: '100%' }} />
                )}
                <div>{formatDate(message.created_at)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button onClick={() => (isRecording ? stopRecording() : startRecording())}>
            {isRecording ? <MicOff /> : <Mic />}
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button onClick={handleSendMessage}>
            <Send />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
