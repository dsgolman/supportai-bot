"use client";

import { Hume } from 'hume';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getChannel } from '@/utils/socket';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { v4 as uuidv4 } from 'uuid';
import SpeechRecognitionComponent from '@/components/SpeechRecognition';
import { Howl } from 'howler';
import { Send, User, Bot, Users, MessageSquare, Hand } from 'lucide-react';
import { createClient } from "@/utils/supabase/client";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isBot: boolean;
  role: 'speaker' | 'listener';
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  group_id: string | null;
}

const GroupAudioRoom = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('id');
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'bot', name: 'AI Assistant', avatar: '/bot-avatar.png', isSpeaking: false, isBot: true, role: 'speaker' },
    { id: 'user1', name: 'You', avatar: '/user-avatar.png', isSpeaking: false, isBot: false, role: 'speaker' },
    { id: 'user2', name: 'Alice', avatar: '/alice-avatar.png', isSpeaking: false, isBot: false, role: 'listener' },
    { id: 'user3', name: 'Bob', avatar: '/bob-avatar.png', isSpeaking: false, isBot: false, role: 'listener' },
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionAndInitializeChannel = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          console.error("No active session found");
          return;
        }

        const currentUserId = session.user.id;
        setUserId(currentUserId);
        const ch = getChannel(currentUserId);
        setChannel(ch);

        const handleNewMessage = (payload: { body: string, user_id: string }) => {
          console.log("Received new_message event:", payload);
          addMessage(payload.user_id, payload.body);
          updateParticipantSpeakingStatus(payload.user_id, true);
        };

        const handleBotMessage = (payload: { message: string }) => {
          console.log("Received bot_message event:", payload);
          addMessage('bot', payload.message);
          updateParticipantSpeakingStatus('bot', true);
        };

        const handleAudioOutput = (payload: { data: string }) => {
          console.log("Received audio_output event:", payload);
          const audioData = `data:audio/wav;base64,${payload.data}`;
          audioQueueRef.current.push(audioData);
          if (!isPlayingRef.current) {
            playNextAudio();
          }
        };

        ch.on("new_message", handleNewMessage);
        ch.on("bot_message", handleBotMessage);
        ch.on("audio_output", handleAudioOutput);

        return () => {
          ch.off("new_message", handleNewMessage);
          ch.off("bot_message", handleBotMessage);
          ch.off("audio_output", handleAudioOutput);
          ch.leave();
        };
      } catch (error) {
        console.error("Error fetching session or initializing channel:", error);
      }
    };

    fetchSessionAndInitializeChannel();
  }, [groupId, supabase]);

  function addMessage(userId: string | null, content: string) {
    if (userId === null) {
      console.error("User ID is null. Cannot add message.");
      return;
    }
    setMessages(prevMessages => [
      ...prevMessages,
      { id: uuidv4(), user_id: userId, content, created_at: new Date().toISOString(), group_id: groupId }
    ]);
  };

  const updateParticipantSpeakingStatus = (userId:  string | null, isSpeaking: boolean) => {
    setParticipants(prevParticipants =>
      prevParticipants.map(p =>
        p.id === userId ? { ...p, isSpeaking } : p
      )
    );
  };

  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      updateParticipantSpeakingStatus('bot', false);
      return;
    }

    isPlayingRef.current = true;
    updateParticipantSpeakingStatus('bot', true);
    const audioData = audioQueueRef.current.shift()!;

    const sound = new Howl({
      src: [audioData],
      format: ['wav'],
      onend: () => {
        playNextAudio();
      },
      onloaderror: (id, error) => {
        console.error("Error loading audio:", error);
        updateParticipantSpeakingStatus('bot', false);
      },
      onplayerror: (id, error) => {
        console.error("Error playing audio:", error);
        updateParticipantSpeakingStatus('bot', false);
      },
    });

    sound.play();
  };

  async function handleToolCallMessage(
    toolCallMessage: Hume.empathicVoice.ToolCallMessage,
    socket: Hume.empathicVoice.chat.ChatSocket): Promise<void> {
    if (toolCallMessage.name === "raiseHand") {
      // 1. Parse the parameters from the Tool Call message
      const args = JSON.parse(toolCallMessage.parameters) as {
        userId: string;
      };
      // 2. Extract the individual arguments
      const { userId } = args;
      // 3. Call fetch weather function with extracted arguments
    //   await handleRaiseHand(userId);
      // 4. Construct a Tool Response message containing the result
      const toolResponseMessage = {
        type: "tool_response",
        toolCallId: toolCallMessage.toolCallId,
        content: "You may now speak",
      };
      // 5. Send Tool Response message to the WebSocket
    //   socket.sendToolResponseMessage(toolResponseMessage);

      channel.push("message", { toolResponseMessage })
      .receive("ok", (resp: any) => {
        console.log("Message sent successfully:", resp);
        // addMessage(userId, message);
        // updateParticipantSpeakingStatus(userId, true);
        // setTimeout(() => updateParticipantSpeakingStatus(userId, false), 3000);
      })
      .receive("error", (resp: any) => {
        console.log("Failed to send message:", resp);
      });
    }
  }

  const sendWebSocketMessage = (message: string) => {
    if (!channel || message.trim() === '') return;

    console.log("Sending message:", message);
    channel.push("message", { body: message, type: "text", user_id: userId })
      .receive("ok", (resp: any) => {
        console.log("Message sent successfully:", resp);
        addMessage(userId, message);
        updateParticipantSpeakingStatus(userId, true);
        setTimeout(() => updateParticipantSpeakingStatus(userId, false), 3000);
      })
      .receive("error", (resp: any) => {
        console.log("Failed to send message:", resp);
      });
  };

  const handleSpeechRecognitionResult = (transcript: string) => {
    console.log("Speech recognition result:", transcript);
    if (transcript.trim() !== '') {
      sendWebSocketMessage(transcript);
    }
  };

  const handleRaiseHand = (userId: string | null ) => {
    if (!channel || !userId) return;

    const message = `user #${userId} raised their hand`;
    console.log("Sending raise hand message:", message);
    sendWebSocketMessage(message);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Users className="mr-2" /> Audio Room
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3 space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Speakers</h3>
              <div className="grid grid-cols-2 gap-4">
                {participants.filter(p => p.role === 'speaker').map((participant) => (
                  <div key={participant.id} className="flex flex-col items-center">
                    <Avatar className={`w-16 h-16 ${participant.isSpeaking ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback>{participant.isBot ? <Bot /> : <User />}</AvatarFallback>
                    </Avatar>
                    <span className="mt-2 font-medium text-sm">{participant.name}</span>
                    {participant.isSpeaking && (
                      <span className="text-xs text-primary animate-pulse">Speaking</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Listeners</h3>
              <div className="grid grid-cols-2 gap-4">
                {participants.filter(p => p.role === 'listener').map((participant) => (
                  <div key={participant.id} className="flex flex-col items-center">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback>{participant.isBot ? <Bot /> : <User />}</AvatarFallback>
                    </Avatar>
                    <span className="mt-1 font-medium text-xs">{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => handleRaiseHand(userId)}>
                <Hand className="w-4 h-4 mr-2" />
                Raise Hand
              </Button>
              <SpeechRecognitionComponent onResult={handleSpeechRecognitionResult} />
            </div>
          </div>
          <div className="w-full md:w-1/3 border-l pl-4">
            <div className="flex items-center mb-2">
              <MessageSquare className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-semibold">Chat</h3>
            </div>
            <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`mb-2 p-2 rounded-lg ${message.user_id === userId ? 'bg-blue-100' : 'bg-gray-100'}`}
                >
                  <p className="text-xs font-semibold">{participants.find(p => p.id === message.user_id)?.name}</p>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </ScrollArea>
            <div className="mt-4 flex space-x-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message"
                className="flex-grow"
              />
              <Button
                onClick={() => {
                  sendWebSocketMessage(newMessage);
                  setNewMessage('');
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupAudioRoom;