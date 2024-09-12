"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Hand, Mic, MicOff } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { LLMHelper, VoiceEvent } from 'realtime-ai';
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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [selectedUserForHandRaise, setSelectedUserForHandRaise] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceClient = useVoiceClient()!;
  const localAudioTrack = useVoiceClientMediaTrack("audio", "local");
  const botAudioTrack = useVoiceClientMediaTrack("audio", "bot");

  const supabase = createClient();
  
  
  useEffect(() => {
    if (localAudioRef.current && localAudioTrack) {
      localAudioRef.current.srcObject = new MediaStream([localAudioTrack]);
    }
  }, [localAudioTrack]);

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

  useVoiceClientEvent(VoiceEvent.BotStartedSpeaking, () => {
    console.log('Bot started speaking');
    startBotRecording();
  });

  useVoiceClientEvent(VoiceEvent.BotStoppedSpeaking, () => {
    console.log('Bot stopped speaking');
    stopBotRecording();
  });

  const handleHandRaise = async (payload: any) => {
    if (isFirstUser && payload.new.raised) {
      setSelectedUserForHandRaise(payload.new.user_id);
      console.log(payload.new.raised);

      await (voiceClient.getHelper("llm") as LLMHelper).appendToMessages({
        role: "user",
        content: `userId: ${payload.new.user_id}, has raised hand in groupId: ${groupId}`,
      }, true);
    }
  };

  // (voiceClient.getHelper("llm") as LLMHelper).handleFunctionCall(async (fn: FunctionCallParams) => {
  //   console.log("tool calling", fn.functionName, fn);
  //   if (fn.functionName === "get_raised_hand" && fn.arguments?.groupId) {
  //     const { data, error } = await supabase
  //       .from('raised_hands')
  //       .select('*')
  //       .eq('group_id', fn.arguments.groupId)
  //       .eq('raised', true)
  //       .order('created_at', { ascending: true })
  //       .limit(1);

  //     if (error) {
  //       console.error('Error fetching raised hands:', error);
  //       return { error: "couldn't fetch raised hands" };
  //     } else {
  //       const firstRaisedHand = data[0];
  //       if (firstRaisedHand) {
  //         const { error: updateError } = await supabase
  //           .from('call_state')
  //           .update({ active_speaker_id: firstRaisedHand.user_id })
  //           .eq('group_id', fn.arguments.groupId);

  //         if (updateError) {
  //           console.error('Error updating active speaker:', updateError);
  //           return { error: "couldn't update active speaker" };
  //         }

  //         setActiveSpeakerId(firstRaisedHand.user_id);
  //         return "Thank you for raising your hand. You can now record your message"
  //       }
  //     }
  //   } else {
  //     console.log("error tool calling");
  //     return { error: "Invalid function call" };
  //   }
  // });

  const createFallbackLocalAudioTrack = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const [track] = stream.getAudioTracks();
    return track;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      handleUpload();
    }
  };

  const handleUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);

    const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
    const audioUrl = await uploadAudioToSupabase(audioBlob);

    if (audioUrl) {
      await sendMessage(null, audioUrl);
    }

    recordedChunksRef.current = [];
    setIsUploading(false);
  };

  const uploadAudioToSupabase = async (audioBlob: Blob) => {
    const fileName = `${groupId}/${uuidv4()}.webm`;
    const { data, error: uploadError } = await supabase.storage
      .from('audio-messages')
      .upload(fileName, audioBlob);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const publicURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-messages/${fileName}`;
    return publicURL;
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
    if (!botAudioTrack) return;

    const stream = new MediaStream([botAudioTrack]);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start(100);
    return mediaRecorder;
  };

  const stopBotRecording = async () => {
    const botRecorder = startBotRecording();
    if (botRecorder) {
      botRecorder.stop();
      const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      const audioUrl = await uploadAudioToSupabase(audioBlob);
      await sendMessage(null, audioUrl);
      recordedChunksRef.current = [];
    }
  };

  const handleHandRaiseClick = async () => {
    setHandRaised(!handRaised);

    if (handRaised) {
      const { error } = await supabase
        .from('raised_hands')
        .insert([{ user_id: userId, group_id: groupId, raised: false }]);

      if (error) {
        console.error('Error updating hand raise status:', error);
      }
    } else {
      const { error } = await supabase
        .from('raised_hands')
        .insert([{ user_id: userId, group_id: groupId, raised: true }]);

      if (error) {
        console.error('Error updating hand raise status:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {loading ? (
            <p>Loading...</p>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                <p>{message.content}</p>
                {message.audio_url && !isFirstUser && <audio controls src={message.audio_url} />}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter>
          <Button type="button" onClick={() => isRecording ? stopRecording() : startRecording()}>
            {isRecording ? <MicOff /> : <Mic />}
          </Button>
          <Button type="button" onClick={handleHandRaiseClick}>
            {handRaised ? <Hand /> : 'Raise Hand'}
          </Button>
          <Button type="submit" disabled={isUploading}>
            Send
          </Button>
        
        <audio ref={localAudioRef} autoPlay />
      </CardFooter>
    </Card>
  );
}
