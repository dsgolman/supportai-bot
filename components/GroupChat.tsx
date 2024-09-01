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
import { useVoiceClient, VoiceClientAudio, useVoiceClientMediaTrack } from 'realtime-ai-react';

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
  isFirstUser: boolean; // Add this prop to determine if the user is the first user
}

export function GroupChat({ groupId, userId, isFirstUser }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceClient = useVoiceClient()!;
  const localAudioTrack = useVoiceClientMediaTrack("audio", "local");
  const botAudioTrack = useVoiceClientMediaTrack("audio", "bot");
  const localAudioRef = useRef<HTMLAudioElement>(null);

  const supabase = createClient();

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

  useEffect(() => {
    if (!localAudioRef.current || !localAudioTrack) return;
    localAudioRef.current.srcObject = new MediaStream([localAudioTrack]);
  }, [localAudioTrack]);

  useEffect(() => {
    if (voiceClient) {
      voiceClient.enableMic(true);
    }
  }, [voiceClient]);

  useEffect(() => {
    if (isFirstUser && botAudioTrack) {
      const channel = supabase.channel(`audio_${groupId}`);

      const broadcastAudio = async () => {
        const stream = new MediaStream([botAudioTrack]);
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const audioArrayBuffer = await event.data.arrayBuffer();
            channel.send({
              type: 'broadcast',
              event: 'audio',
              payload: { audio: audioArrayBuffer },
            });
          }
        };

        mediaRecorder.start(100); // Broadcast every 100ms
      };

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastAudio();
        }
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isFirstUser, groupId, supabase, botAudioTrack]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = await uploadAudioToSupabase(audioBlob);
          if (audioUrl) {
            await sendMessage(null, audioUrl);
          }
          setAudioChunks([]);
        }
      };

      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioToSupabase = async (audioBlob: Blob) => {
    const fileName = `${userId}/${groupId}/${uuidv4()}.webm`;
    console.log(`Uploading audio with fileName: ${fileName}`);

    const { data, error: uploadError } = await supabase.storage
      .from('audio-messages')
      .upload(fileName, audioBlob);

    if (uploadError) {
      console.error('Error uploading audio:', uploadError);
      return null;
    }

    console.log(`Audio uploaded successfully. Constructing public URL.`);
    const publicURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-messages/${fileName}`;

    console.log(`Public URL obtained: ${publicURL}`);
    return publicURL;
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    await sendMessage(newMessage, null);
    setNewMessage('');
  };

  const sendMessage = async (content: string | null, audioUrl: string | null) => {
    const messageContent = content ?? 'Audio message';
    const { error } = await supabase.from('messages').insert([
      {
        user_id: userId,
        content: messageContent,
        audio_url: audioUrl,
        group_id: groupId,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading messages...</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`mb-4 flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{msg.user_id.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</p>
                  </div>
                  {msg.content && !msg.audio_url && (
                    <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.user_id === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  )}
                  {msg.audio_url && (
                    <div className="mt-2">
                      <audio controls>
                        <source src={msg.audio_url} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="w-full flex space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSendMessage}>
            <Send className="w-5 h-5" />
          </Button>
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive">
              <MicOff className="w-5 h-5" />
            </Button>
          ) : (
            <Button onClick={startRecording} variant="outline">
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardFooter>
      {voiceClient && isFirstUser && <VoiceClientAudio />}
      {!isFirstUser && <audio ref={localAudioRef} autoPlay />}
    </Card>
  );
}