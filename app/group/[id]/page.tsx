'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getChannel } from '@/utils/socket';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuidv4 } from 'uuid';
import SpeechRecognition from '@/components/SpeechRecognition';
import AudioCapture from '@/components/AudioCapture';
import { createClient } from '@/utils/supabase/client';
import { Mic, MicOff, Hand, HandMetal, Users, Volume2, VolumeX, Wifi, WifiOff, Heart, Sun, Smile, LogOut, MessageSquare } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Hume } from 'hume';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  id: string;
  full_name: string;
  avatar: string;
  isSpeaking: boolean;
  isBot: boolean;
  role: 'speaker' | 'listener';
  handRaised: boolean;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  group_id: string | null;
}

export default function ScheduledGroupAudioRoom() {
  const { id: groupId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [channelJoined, setChannelJoined] = useState(false);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState<number>(180);
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState(false);
  const [isAudioCapturing, setIsAudioCapturing] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const channelRef = useRef<any>(null);
  const audioRef = useRef<Howl | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };

    fetchUserData();
  }, [supabase.auth]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (groupId) {
        const { data: groupMembersData, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
        
        if (groupMembersError) {
          console.error('Error fetching group members:', groupMembersError);
          return;
        }

        const userIds = groupMembersData.map(member => member.user_id);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        const participants = profilesData.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          avatar: profile.avatar_url,
          isSpeaking: false,
          isBot: false,
          role: 'listener' as const,
          handRaised: false
        }));

        setParticipants(participants);
      }
    };

    fetchGroupMembers();
  }, [groupId, supabase]);

  useEffect(() => {
    if (groupId) {
      const { channel } = getChannel(userId, groupId);
      channelRef.current = channel;

      channel.join()
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Joined successfully", resp);
          setConnectionStatus('connected');
          setChannelJoined(true);
        })
        .receive("error", (resp: { [key: string]: any }) => {
          console.log("Unable to join", resp);
          setConnectionStatus('disconnected');
        });

      channel.on("bot_message", (payload: { [key: string]: any }) => {
        console.log("Received new message:", payload);
        addMessage(payload.user_id, payload.message);
      });

      channel.on("active_speaker", (payload: { [key: string]: any }) => {
        console.log("Active speaker changed:", payload);
        setActiveSpeaker(payload.userId);
        updateParticipantSpeakingStatus(payload.userId, true);
      });

      channel.on("participants_update", (payload: { [key: string]: any }) => {
        console.log("Participants updated:", payload);
        setParticipants(payload.participants);
      });

      channel.on("audio_output", (payload: { data: string }) => {
        const audioData = `data:audio/wav;base64,${payload.data}`;
        audioQueueRef.current.push(audioData);
        if (!isPlayingRef.current) {
          playNextAudio();
        }
      });

      channel.on("user_raised_hand", (payload: { [key: string]: any }) => {
        console.log("User raised hand:", payload);
        updateParticipantHandStatus(payload.user_id, true);
        channelRef.current.push("tool_call_response", {
          content: `You may now speak, ${payload.user_id}!`,
          tool_call_id: payload.tool_call_id,
          user_id: payload.user_id,
          group_id: payload.group_id,
        });
      });

      channel.on("user_lowered_hand", (payload: { [key: string]: any }) => {
        console.log("User lowered hand:", payload);
        updateParticipantHandStatus(payload.user_id, false);
      });

      return () => {
        channel.leave();
      };
    }
  }, [groupId, userId]);

  const updateParticipantHandStatus = useCallback((userId: string, handRaised: boolean) => {
    setParticipants(prevParticipants => 
      prevParticipants.map(participant => 
        participant.id === userId 
          ? { ...participant, handRaised } 
          : participant
      )
    );
  }, []);

  const updateParticipantSpeakingStatus = useCallback((userId: string, isSpeaking: boolean) => {
    setParticipants(prevParticipants => 
      prevParticipants.map(participant => 
        participant.id === userId 
          ? { ...participant, isSpeaking } 
          : { ...participant, isSpeaking: false }
      )
    );
  }, []);

  const addMessage = useCallback((userId: string, content: string) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: uuidv4(),
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        group_id: typeof groupId === 'string' ? groupId : null
      }
    ]);
  }, [groupId]);

  const handleAudioInput = useCallback((audioInput: Omit<Hume.empathicVoice.AudioInput, 'type'>) => {
    if (channelRef.current && isTalking) {
      channelRef.current.push("audio_input", audioInput)
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Audio input sent:", resp);
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error sending audio input:", err);
        });
    }
  }, [isTalking]);

  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      updateParticipantSpeakingStatus('bot', false);
      return;
    }

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;

    const sound = new Howl({
      src: [audioData],
      format: ['wav'],
      onend: () => {
        playNextAudio();
      },
      onloaderror: (id, error) => {
        console.error('Howl load error:', error);
      },
      onplayerror: (id, error) => {
        console.error('Howl play error:', error);
      },
    });

    sound.play();
  }, [updateParticipantSpeakingStatus]);

  const handleSpeechRecognitionResult = useCallback((transcript: string) => {
    if (userId && isTalking) {
      addMessage(userId, transcript);
      channelRef.current.push("new_msg", { user_id: userId, content: transcript });
    }
  }, [userId, isTalking, addMessage]);

  const joinCall = useCallback(async () => {
    if (!channelRef.current || !userId || !groupId || !channelJoined) return;

    try {
      channelRef.current.push("start_call", { groupId })
        .receive("ok", async (resp: { [key: string]: any }) => {
          console.log("Joined call:", resp);
          setIsInCall(true);
          toast({
            title: "Joined Circle",
            description: "You have successfully joined the wellness circle.",
          });
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error joining call:", err);
          toast({
            title: "Join Error",
            description: "Failed to join the wellness circle. Please try again.",
            variant: "destructive",
          });
        });
    } catch (error) {
      console.error("Error joining call:", error);
      toast({
        title: "Join Error",
        description: "An unexpected error occurred while joining the circle.",
        variant: "destructive",
      });
    }
  }, [channelJoined, groupId, userId]);

  const leaveCall = useCallback(() => {
    if (!channelRef.current || !userId || !groupId) return;

    channelRef.current.push("end_call", { groupId })
      .receive("ok", (resp: { [key: string]: any }) => {
        console.log("Left call:", resp);
        setIsInCall(false);
        setHandRaised(false);
        setIsTalking(false);
        setIsSpeechEnabled(false);
        toast({
          title: "Left Circle",
          description: "You have successfully left the wellness circle.",
        });
      })
      .receive("error", (err: { [key: string]: any }) => {
        console.error("Error leaving call:", err);
        toast({
          title: "Leave Error",
          description: "Failed to leave the wellness circle. Please try again.",
          variant: "destructive",
        });
      });
  }, [groupId, userId]);

  const raiseHand = useCallback(() => {
    if (!channelRef.current || !userId || !groupId) return;

    channelRef.current.push("raise_hand", { groupId, userId })
      .receive("ok", (resp: { [key: string]: any }) => {
        console.log("Hand raised:", resp);
        setHandRaised(true);
        updateParticipantHandStatus(userId, true);

        toast({
          title: "Hand Raised",
          description: "You have raised your hand.",
        });
      })
      .receive("error", (err: { [key: string]: any }) => {
        console.error("Error raising hand:", err);
        toast({
          title: "Action Failed",
          description: "Failed to raise hand. Please try again.",
          variant: "destructive",
        });
      });
  }, [groupId, userId, updateParticipantHandStatus]);

  const lowerHand = useCallback(() => {
    if (!channelRef.current || !userId || !groupId) return;

    channelRef.current.push("lower_hand", { groupId, userId })
      .receive("ok", (resp: { [key: string]: any }) => {
        console.log("Hand lowered:", resp);
        setHandRaised(false);
        updateParticipantHandStatus(userId, false);
        setIsSpeechEnabled(false);
        setIsTalking(false);
        setIsAudioCapturing(false);
        setIsSpeechRecognitionActive(false);
        toast({
          title: "Hand Lowered",
          description: "You have lowered your hand.",
        });
      })
      .receive("error", (err: { [key: string]: any }) => {
        console.error("Error lowering hand:", err);
        toast({
          title: "Action Failed",
          description: "Failed to lower hand. Please try again.",
          variant: "destructive",
        });
      });
  }, [groupId, userId, updateParticipantHandStatus]);

  const toggleHand = useCallback(() => {
    if (handRaised) {
      lowerHand();
    } else {
      raiseHand();
    }
  }, [handRaised, lowerHand, raiseHand]);

  const toggleTalking = useCallback(() => {
    if (!isSpeechEnabled) return;
    
    setIsTalking(prevState => !prevState);
    setIsAudioCapturing(prevState => !prevState);
    setIsSpeechRecognitionActive(prevState => !prevState);
  }, [isSpeechEnabled]);

  const toggleMute = useCallback(() => {
    setIsMuted(prevState => !prevState);
  }, []);

  const endTurn = useCallback(() => {
    if (!channelRef.current || !userId || !groupId) return;

    channelRef.current.push("end_turn", { groupId, userId })
      .receive("ok", (resp: { [key: string]: any }) => {
        console.log("Turn ended:", resp);
        setIsSpeechEnabled(false);
        setIsTalking(false);
        setIsAudioCapturing(false);
        setIsSpeechRecognitionActive(false);
        toast({
          title: "Turn Ended",
          description: "You have ended your turn.",
        });
      })
      .receive("error", (err: { [key: string]: any }) => {
        console.error("Error ending turn:", err);
        toast({
          title: "Action Failed",
          description: "Failed to end turn. Please try again.",
          variant: "destructive",
        });
      });
  }, [groupId, userId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (activeSpeaker === userId) {
      setSpeakingTimeLeft(180);
      setIsSpeechEnabled(true);
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current);
      }
      speakingTimerRef.current = setInterval(() => {
        setSpeakingTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(speakingTimerRef.current!);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      setIsSpeechEnabled(false);
      setIsTalking(false);
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current);
      }
    }

    return () => {
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current);
      }
    };
  }, [activeSpeaker, userId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800 flex flex-col">
      <header className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-amber-700">Wellness Circle</h1>
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="text-green-500" />
          ) : (
            <WifiOff className="text-red-500" />
          )}
          <span className={connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        <section className="lg:w-2/3 flex flex-col gap-6">
          <Card className="bg-white border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-700">
                <Users className="mr-2" /> Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {participants.map(participant => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col items-center p-3 rounded-lg ${
                        participant.isSpeaking ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-white'
                      } transition-all duration-300 ease-in-out`}
                    >
                      <Avatar className="h-16 w-16 mb-2 ring-2 ring-amber-300">
                        <AvatarImage src={participant.avatar} alt={participant.full_name} />
                        <AvatarFallback>{participant.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <div className="font-medium text-gray-800 truncate max-w-[100px]">{participant.full_name}</div>
                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                          {participant.isSpeaking && <Sun className="w-3 h-3 text-amber-500" />}
                          {participant.isBot && <span className="text-blue-500">Facilitator</span>}
                          {participant.handRaised && !participant.isSpeaking && <Hand className="w-3 h-3 text-yellow-500" />}
                          <span>{participant.role}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-amber-200 flex-grow overflow-hidden">
            <CardHeader>
              <CardTitle className="text-amber-700 flex items-center">
                <MessageSquare className="mr-2" /> Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-400px)] px-4">
                <div ref={scrollAreaRef} className="space-y-4 pb-4">
                  {messages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 rounded-lg text-gray-800 text-sm ${
                        message.user_id === 'bot' ? 'bg-amber-50' : 'bg-white border border-amber-200'
                      }`}
                    >
                      <div className="font-semibold text-amber-700 mb-1">{message.user_id === 'bot' ? 'Facilitator' : message.user_id}</div>
                      <div className="text-gray-700">{message.content}</div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
        <aside className="lg:w-1/3 flex flex-col gap-6">
          <Card className="bg-white border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-700">Room Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isInCall ? (
                <Button 
                  onClick={joinCall} 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-colors duration-300"
                  disabled={connectionStatus !== 'connected' || !channelJoined}
                >
                  Join Circle
                </Button>
              ) : (
                <>
                  {activeSpeaker !== userId && (
                    <Button 
                      onClick={toggleHand}
                      className={`w-full ${
                        handRaised 
                          ? "bg-yellow-500 hover:bg-yellow-600" 
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white transition-colors duration-300`}
                    >
                      {handRaised ? <HandMetal className="mr-2 h-4 w-4" /> : <Hand className="mr-2 h-4 w-4" />}
                      {handRaised ? 'Lower Hand' : 'Raise Hand'}
                    </Button>
                  )}
                  {activeSpeaker === userId && (
                    <>
                      <Button 
                        onClick={toggleTalking}
                        className={`w-full ${
                          isTalking 
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-gray-400 hover:bg-gray-500"
                        } text-white transition-colors duration-300`}
                        disabled={!isSpeechEnabled}
                      >
                        {isTalking ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {isTalking ? 'Stop Sharing' : 'Start Sharing'}
                      </Button>
                      <Button 
                        onClick={toggleMute}
                        className={`w-full ${
                          isMuted 
                            ? "bg-red-500 hover:bg-red-600" 
                            : "bg-gray-400 hover:bg-gray-500"
                        } text-white transition-colors duration-300`}
                      >
                        {isMuted ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                        {isMuted ? 'Unmute' : 'Mute'}
                      </Button>
                      <Button 
                        onClick={endTurn}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-300"
                      >
                        End Turn
                      </Button>
                    </>
                  )}
                  <Button onClick={leaveCall} className="w-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-300">
                    <LogOut className="mr-2 h-4 w-4" /> Leave Circle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          {activeSpeaker === userId && (
            <Card className="bg-white border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-700">Speaking Timer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-3xl font-bold text-amber-600">
                  {Math.floor(speakingTimeLeft / 60)}:{(speakingTimeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(speakingTimeLeft / 180) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </main>
      {activeSpeaker === userId && (
        <div className="hidden">
          <AudioCapture onAudioInput={handleAudioInput} isActive={isAudioCapturing && isTalking && !isMuted} />
          <SpeechRecognition onResult={handleSpeechRecognitionResult} isActive={isSpeechRecognitionActive && isTalking && !isMuted} />
        </div>
      )}
    </div>
  );
}