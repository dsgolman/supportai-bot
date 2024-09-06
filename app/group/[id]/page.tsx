"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getChannel } from '@/utils/socket';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import WaveSurfer from 'wavesurfer.js';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  group_id: string;
  audio_url?: string;
}

const GroupChatPage = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('id'); // Get the groupId from the URL
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Use ref for chunks

  useEffect(() => {
    // Initialize and join the WebSocket channel
    const ch = getChannel();
    setChannel(ch);

    // Listen for incoming messages
    const handleNewMessage = (payload: { body: string }) => {
      console.log("Received message:", payload);
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: uuidv4(), user_id: 'bot', content: payload.body, created_at: new Date().toISOString(), group_id: groupId }
      ]);
    };

    const handleBotMessage = (payload: { response: string }) => {
      console.log("Bot response received:", payload);
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: uuidv4(), user_id: 'bot', content: payload.response, created_at: new Date().toISOString(), group_id: groupId }
      ]);
    };

    ch.on("new_message", handleNewMessage);
    ch.on("bot_message", handleBotMessage);

    ch.on("audio_output", payload => {
      console.log("Audio output received:", payload);
      setAudioData(payload.data);  // Handle audio data (e.g., play it)
      if (wavesurferRef.current) {
        wavesurferRef.current.load(`data:audio/wav;base64,${payload.data}`);
      }
    });

    // Clean up the channel when the component unmounts
    return () => {
      ch.off("new_message", handleNewMessage);
      ch.off("bot_message", handleBotMessage);
      ch.leave();
    };
  }, []);

  useEffect(() => {
    if (waveformRef.current) {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        height: 80,
      });
      wavesurferRef.current = wavesurfer;
    }
  }, []);

  const sendWebSocketMessage = (message: string) => {
    if (!channel) return;  // Ensure the channel is initialized
    console.log(message);
    // Send message to the server
    channel.push("message", { body: message, type: "text" })
      .receive("ok", (resp: any) => {
        console.log("Message sent:", resp);
        // Add user message to the local state
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: uuidv4(), user_id: 'user', content: message, created_at: new Date().toISOString(), group_id: groupId }
        ]);
      })
      .receive("error", (resp: any) => {
        console.log("Failed to send message:", resp);
      });
  };

  const handleAudioChunk = (audioChunk: Blob) => {
    audioChunksRef.current.push(audioChunk);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      console.error("Media devices are not available.");
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          handleAudioChunk(event.data); // Send chunk immediately
        }
      };
  
      mediaRecorder.start(100); // Capture chunks every 500ms
      setIsRecording(true);

      // Notify the server that the user started speaking
      channel?.push("user_still_speaking", { event: 'user_still_speaking' });

      mediaRecorder.onstop = () => {
        // Notify the server that the user stopped speaking
        // channel?.push("user_stopped_speaking", { event: 'user_stopped_speaking' });
        setIsRecording(false);
      };
  
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };
  
  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
  
      // Function to send a single audio chunk and return a Promise
      const sendChunk = (chunk: Blob) => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            channel.push("audio_chunk", { data: base64data?.split(',')[1], type: "audio" })
              .receive("ok", () => resolve())
              .receive("error", (error) => reject(error));
          };
          reader.readAsDataURL(chunk);
        });
      };
  
      // Send all collected chunks to the server and wait for all to complete
      const sendAllChunks = async () => {
        try {
          await Promise.all(audioChunksRef.current.map(sendChunk));
          // Notify the server that the user stopped speaking after all chunks are sent
          channel?.push("user_stopped_speaking", { event: 'user_stopped_speaking' });
        } catch (error) {
          console.error("Failed to send one or more audio chunks:", error);
        } finally {
          // Clear the audioChunksRef array
          audioChunksRef.current = [];
          setIsRecording(false);
        }
      };
  
      sendAllChunks();
    }
  };  
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleAudioMessage = (payload: { data: string }) => {
      console.log("Audio message received:", payload);
      const audioData = `data:audio/wav;base64,${payload.data}`;
      const audio = new Audio(audioData);
      audio.playbackRate = 1.0; // Ensure the playback rate is set to normal speed
      audio.play();
    };

    if (channel) {
      channel.on("audio_message", handleAudioMessage);
    }

    return () => {
      if (channel) {
        channel.off("audio_message", handleAudioMessage);
      }
    };
  }, [channel]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea ref={scrollAreaRef} className="h-[500px] overflow-y-auto">
          <div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-2 p-2 border-b border-gray-200 ${message.user_id === 'user' ? 'text-blue-500' : 'text-gray-500'}`}
              >
                <div className="font-semibold">{message.user_id === 'user' ? 'You' : 'Bot'}</div>
                <div>{message.content}</div>
                {message.audio_url && <audio controls src={message.audio_url} />}
              </div>
            ))}
          </div>
        </ScrollArea>
        {audioData && <audio src={`data:audio/wav;base64,${audioData}`} autoPlay />}
        <div ref={waveformRef} />
      </CardContent>
      <CardFooter>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message"
        />
        <Button type="submit" onClick={() => {
          sendWebSocketMessage(newMessage);
          setNewMessage(''); // Clear input after sending
        }}>
          Send
        </Button>
        <Button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GroupChatPage;
