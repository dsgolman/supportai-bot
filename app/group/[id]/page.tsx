'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getChannel } from '@/utils/socket';
import { Hume } from 'hume';
import { Howl } from 'howler';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import SpeechRecognition from '@/components/SpeechRecognition';
import AudioCapture from '@/components/AudioCapture';

import { Mic, MicOff, Hand, Volume2, VolumeX, Wifi, WifiOff, LogOut, FastForward, MessageSquare, Users, Send } from 'lucide-react';

interface Participant {
  id: string;
  full_name: string;
  avatar: string;
  isSpeaking: boolean;
  isBot: boolean;
  role: string;
  handRaised: boolean;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export default function GroupPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [groupName, setGroupName] = useState<string>("Wellness Circle");
  const [configId, setConfigId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('');
  const [handRaised, setHandRaised] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [channelJoined, setChannelJoined] = useState(false);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState<number>(180);
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState(false);
  const [isAudioCapturing, setIsAudioCapturing] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastInitial, setLastInitial] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'room' | 'chat'>('room');
  const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  const channelRef = useRef<any>(null);
  const audioRef = useRef<Howl | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await ensureUserInGroup(session.user.id);
      } else {
        setIsNameModalOpen(true);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (groupId) {
        const { data, error } = await supabase
          .from('groups')
          .select('name, config_id')
          .eq('id', groupId)
          .single();

        if (data && !error) {
          setGroupName(data.name);
          console.log(data);
          setConfigId(data.config_id);
        }
      }
    };

    fetchGroupData();
  }, [groupId, configId, supabase]);

  useEffect(() => {
    const startTimeParam = searchParams.get('startTime');
    if (startTimeParam) {
      const startTime = new Date(parseInt(startTimeParam));
      setSessionStartTime(startTime);
      const now = new Date();
      if (startTime <= now) {
        setIsSessionStarted(true);
        setCountdownTime(0);
      } else {
        setIsSessionStarted(false);
        setCountdownTime(Math.floor((startTime.getTime() - now.getTime()) / 1000));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (sessionStartTime && !isSessionStarted) {
      const timer = setInterval(() => {
        const now = new Date();
        const timeLeft = sessionStartTime.getTime() - now.getTime();
        if (timeLeft <= 0) {
          setIsSessionStarted(true);
          setCountdownTime(0);
          clearInterval(timer);
        } else {
          setCountdownTime(Math.floor(timeLeft / 1000));
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionStartTime, isSessionStarted]);

  const ensureUserInGroup = async (userId: string) => {
    if (!groupId) return;

    const { data: existingMember, error: memberError } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error checking group membership:', memberError);
      return;
    }

    if (!existingMember) {
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({ user_id: userId, group_id: groupId });

      if (insertError) {
        console.error('Error inserting group member:', insertError);
        return;
      }
    }

    await fetchGroupMembers();
  };

  const fetchGroupMembers = useCallback(async () => {
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
        role: 'listener',
        handRaised: false
      }));

      participants.push({
        id: 'bot',
        full_name: 'AI Facilitator',
        avatar: '/placeholder.svg?height=100&width=100',
        isSpeaking: false,
        isBot: true,
        role: 'speaker',
        handRaised: false
      });

      setParticipants(participants);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  useEffect(() => {
    if (groupId && userId && configId) {
      const { channel } = getChannel(userId, groupId, configId);
      channelRef.current = channel;

      channel.join()
        .receive("ok", (resp: Record<string, unknown>) => {
          console.log("Joined successfully", resp);
          setConnectionStatus('connected');
          setChannelJoined(true);
        })
        .receive("error", (resp: Record<string, unknown>) => {
          console.log("Unable to join", resp);
          setConnectionStatus('disconnected');
        });

      channel.on("active_speaker", (payload: { userId: string }) => {
        setTimeout(() => {
          console.log("Active speaker changed:", payload);
          setActiveSpeaker(payload.userId);
          updateParticipantSpeakingStatus(payload.userId, true);
        }, 10000);
       
      });

      channel.on("participants_update", (payload: { participants: Participant[] }) => {
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

      channel.on("user_raised_hand", (payload: { user_id: string; tool_call_id: string; group_id: string }) => {
        console.log("User raised hand:", payload);
        updateParticipantHandStatus(payload.user_id, true);
        channelRef.current.push("tool_call_response", {
          content: `You may now speak, ${payload.user_id}!`,
          tool_call_id: payload.tool_call_id,
          user_id: payload.user_id,
          group_id: payload.group_id,
        });
      });

      channel.on("user_lowered_hand", (payload: { user_id: string; tool_call_id: string; group_id: string }) => {
        console.log("User lowered hand:", payload);
        updateParticipantHandStatus(payload.user_id, false);
        channelRef.current.push("tool_call_response", {
          content: `Your hand as been lowered, ${payload.user_id}!`,
          tool_call_id: payload.tool_call_id,
          user_id: payload.user_id,
          group_id: payload.group_id,
        });
      });

      channel.on("session_started", (payload: { start_time: string }) => {
        setIsSessionStarted(true);
        setSessionStartTime(new Date(payload.start_time));
      });

      channel.on("bot_message", (payload: { [key: string]: any }) => {
        console.log("Received new message:", payload);
        setMessages(prev => [...prev, { sender: 'Bot', content: payload.message.trim() }]);
      });

      return () => {
        channel.leave();
      };
    }
  }, [groupId, userId, configId]);

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

  const handleAudioInput = useCallback((audioInput: Omit<Hume.empathicVoice.AudioInput, 'type'>) => {
    if (channelRef.current && isTalking) {
      channelRef.current.push("audio_input", audioInput)
        .receive("ok", (resp: Record<string, unknown>) => {
          console.log("Audio input sent:", resp);
        })
        .receive("error", (err: Record<string, unknown>) => {
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
      onloaderror: (_id, error) => {
        console.error('Howl load error:', error);
      },
      onplayerror: (_id, error) => {
        console.error('Howl play error:', error);
      },
    });

    sound.play();
  }, [updateParticipantSpeakingStatus]);

  const handleSpeechRecognitionResult = useCallback((transcript: string) => {
    if (userId && isTalking) {
      channelRef.current.push("user_input", { user_id: userId, content: transcript });
    }
  }, [userId, isTalking]);

  const joinCall = useCallback(async () => {
    if (!channelRef.current || !groupId || !channelJoined || !configId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      await ensureUserInGroup(session.user.id);
      setIsInCall(true);
      channelRef.current.push("start_call", { groupId, userId, configId })
        .receive("ok", (resp: Record<string, unknown>) => {
          console.log("Joined call:", resp);
          toast({
            title: "Joined Circle",
            description: `You have successfully joined the ${groupName}.`,
          });
        })
        .receive("error", (err: Record<string, unknown>) => {
          console.error("Error joining call:", err);
          toast({
            title: "Join Error",
            description: `Failed to join the ${groupName}. Please try again.`,
            variant: "destructive",
          });
        });
    } else {
      setIsNameModalOpen(true);
    }
  }, [channelJoined, groupId, configId, supabase.auth, ensureUserInGroup, groupName]);

  const handleNameSubmit = useCallback(async () => {
    if (!firstName || !lastInitial || !configId) {
      toast({
        title: "Error",
        description: "Please enter your first name and last initial.",
        variant: "destructive",
      });
      return;
    }

    try {
      let user;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        user = data.user;
      } else {
        user = session.user;
      }

      if (user) {
        const fullName = `${firstName} ${lastInitial}.`;
        const avatarUrl = `/placeholder.svg?height=100&width=100`;

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl
          });

        if (upsertError) throw upsertError;

        await ensureUserInGroup(user.id);

        setUserId(user.id);
        setIsNameModalOpen(false);
        setIsInCall(true);
        toast({
          title: "Joined Circle",
          description: `You have successfully joined the ${groupName}.`,
        });

        channelRef.current.push("start_call", { groupId, userId, configId })
          .receive("ok", (resp: Record<string, unknown>) => {
            console.log("Joined call:", resp);
          })
          .receive("error", (err: Record<string, unknown>) => {
            console.error("Error joining call:", err);
            toast({
              title: "Join Error",
              description: `Failed to join the ${groupName}. Please try again.`,
              variant: "destructive",
            });
          });

        await fetchGroupMembers();
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: "Failed to join the group. Please try again.",
        variant: "destructive",
      });
    }
  }, [firstName, lastInitial, supabase, groupId, configId, fetchGroupMembers, ensureUserInGroup, groupName]);

  const leaveCall = useCallback(() => {
    if (!channelRef.current || !userId || !groupId) return;
      window.location.href= `/support`
    // channelRef.current.push("end_call", { groupId })
    //   .receive("ok", (resp: Record<string, unknown>) => {
    //     console.log("Left call:", resp);
    //     setIsInCall(false);
    //     setHandRaised(false);
    //     setIsTalking(false);
    //     setIsSpeechEnabled(false);
    //     toast({
    //       title: "Left Circle",
    //       description: `You have successfully left the ${groupName}.`,
    //     });
    //   })
    //   .receive("error", (err: Record<string, unknown>) => {
    //     console.error("Error leaving call:", err);
    //     toast({
    //       title: "Leave Error",
    //       description: `Failed to leave the ${groupName}. Please try again.`,
    //       variant: "destructive",
    //     });
    //   });
  }, [groupId, userId, groupName]);

  const toggleHand = useCallback(() => {
    if (!channelRef.current || !userId || !groupId || !isSessionStarted) return;

    if (handRaised) {
      channelRef.current.push("lower_hand", { groupId, userId })
        .receive("ok", (resp: Record<string, unknown>) => {
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
        .receive("error", (err: Record<string, unknown>) => {
          console.error("Error lowering hand:", err);
          toast({
            title: "Action Failed",
            description: "Failed to lower hand. Please try again.",
            variant: "destructive",
          });
        });
    } else {
      channelRef.current.push("raise_hand", { groupId, userId })
        .receive("ok", (resp: Record<string, unknown>) => {
          console.log("Hand raised:", resp);
          setHandRaised(true);
          updateParticipantHandStatus(userId, true);
          toast({
            title: "Hand Raised",
            description: "You have raised your hand.",
          });
        })
        .receive("error", (err: Record<string, unknown>) => {
          console.error("Error raising hand:", err);
          toast({
            title: "Action Failed",
            description: "Failed to raise hand. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [groupId, userId, handRaised, updateParticipantHandStatus, isSessionStarted]);

  const passTurn = useCallback(() => {
    if (!channelRef.current || !userId || !groupId || !isSessionStarted || !handRaised) return;

    channelRef.current.push("pass_turn", { groupId, userId })
      .receive("ok", (resp: Record<string, unknown>) => {
        console.log("Turn passed:", resp);
        setHandRaised(false);
        updateParticipantHandStatus(userId, false);
        setIsSpeechEnabled(false);
        setIsTalking(false);
        setIsAudioCapturing(false);
        setIsSpeechRecognitionActive(false);
        toast({
          title: "Turn Passed",
          description: "You have passed your turn.",
        });
      })
      .receive("error", (err: Record<string, unknown>) => {
        console.error("Error passing turn:", err);
        toast({
          title: "Action Failed",
          description: "Failed to pass turn. Please try again.",
          variant: "destructive",
        });
      });
  }, [groupId, userId, handRaised, updateParticipantHandStatus, isSessionStarted]);

  const toggleTalking = useCallback(() => {
    if (!isSpeechEnabled) return;
    
    setIsTalking(prevState => !prevState);
    setIsAudioCapturing(prevState => !prevState);
    setIsSpeechRecognitionActive(prevState => !prevState);

    if (!isTalking) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            console.log('Audio capture successful');
            // Handle successful audio capture
          })
          .catch(error => {
            console.error('Error capturing audio:', error);
            if (error.name === 'NotAllowedError') {
              toast({
                title: "Microphone Access Denied",
                description: "Please allow microphone access to participate in the call.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Audio Capture Error",
                description: "There was an error capturing audio. Please check your device settings.",
                variant: "destructive",
              });
            }
          });
      } else {
        console.error('getUserMedia not supported on your browser!');
        toast({
          title: "Browser Not Supported",
          description: "Audio input is not supported on your browser. Please try a different browser.",
          variant: "destructive",
        });
      }
    }
  }, [isSpeechEnabled, isTalking]);

  const toggleMute = useCallback(() => {
    setIsMuted(prevState => !prevState);
  }, []);

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
            if (speakingTimerRef.current) {
              clearInterval(speakingTimerRef.current);
            }
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const speakers = participants.filter(p => p.role === 'speaker' || p.isBot);
  const listeners = participants.filter(p => p.role === 'listener' && !p.isBot);

  const sendMessage = useCallback(() => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, { sender: 'You', content: newMessage.trim() }]);
      setNewMessage('');
      // Implement sending message to server
      if (channelRef.current) {
        channelRef.current.push("user_input", { user_id: userId, content: newMessage.trim() });
      }
    }
  }, [newMessage, userId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-amber-700">{groupName}</h1>
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="text-green-500 h-4 w-4" />
          ) : (
            <WifiOff className="text-red-500 h-4 w-4" />
          )}
          <span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'room' | 'chat')} className="h-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="room"><Users className="w-4 h-4 mr-2" />Room</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="room" className="h-[calc(100vh-12rem)]">
            <ScrollArea className="h-full pr-4">
              {!isSessionStarted && countdownTime > 0 && (
                <Card className="mb-4">
                  <CardContent className="p-6 text-center">
                    <h2 className="text-2xl font-semibold text-amber-700 mb-2">Session starts in</h2>
                    <div className="text-4xl font-bold text-amber-600">{formatTime(countdownTime)}</div>
                  </CardContent>
                </Card>
              )}

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Speakers & Facilitators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {speakers.map(participant => (
                      <div key={participant.id} className="flex flex-col items-center">
                        <Avatar className={`h-16 w-16 mb-2 ${participant.isSpeaking ? 'ring-2 ring-amber-500' : ''}`}>
                          <AvatarImage src={participant.avatar} alt={participant.full_name} />
                          <AvatarFallback>{participant.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-center truncate w-full">{participant.full_name}</span>
                        {participant.handRaised && <Hand className="w-4 h-4 text-yellow-500 mt-1" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Listeners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {listeners.map(participant => (
                      <div key={participant.id} className="flex flex-col items-center">
                        <Avatar className={`h-16 w-16 mb-2 ${participant.isSpeaking ? 'ring-2 ring-amber-500' : ''}`}>
                          <AvatarImage src={participant.avatar} alt={participant.full_name} />
                          <AvatarFallback>{participant.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-center truncate w-full">{participant.full_name}</span>
                        {participant.handRaised && <Hand className="w-4 h-4 text-yellow-500 mt-1" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="h-[calc(100vh-12rem)]">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  {messages.map((message, index) => (
                    <div key={index} className="mb-2">
                      <strong>{message.sender}:</strong> {message.content}
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex mt-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 mr-2"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white shadow-sm p-4 sticky bottom-0">
        <div className="flex flex-wrap justify-center items-center space-x-2 space-y-2">
          {isInCall ? (
            <>
              <Button
                onClick={toggleHand}
                variant={handRaised ? "secondary" : "outline"}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Hand className="w-4 h-4 mr-2" />
                {handRaised ? 'Lower Hand' : 'Raise Hand'}
              </Button>
              {handRaised && (
                <Button
                  onClick={passTurn}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <FastForward className="w-4 h-4 mr-2" />
                  Pass Turn
                </Button>
              )}
              <Button
                onClick={toggleTalking}
                variant={isTalking ? "secondary" : "outline"}
                size="sm"
                disabled={!isSpeechEnabled}
                className="w-full sm:w-auto"
              >
                {isTalking ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isTalking ? 'Stop Talking' : 'Start Talking'}
              </Button>
              <Button
                onClick={toggleMute}
                variant={isMuted ? "secondary" : "outline"}
                size="sm"
                className="w-full sm:w-auto"
              >
                {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                onClick={leaveCall}
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Call
              </Button>
            </>
          ) : (
            <Button onClick={joinCall} variant="default" size="sm" className="w-full sm:w-auto">
              Join Call
            </Button>
          )}
        </div>
        {isSpeechEnabled && (
          <div className="mt-2 text-center text-sm">
            Speaking time left: {formatTime(speakingTimeLeft)}
          </div>
        )}
      </footer>

      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogDescription>
              Please enter your first name and last initial to join the group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Last Initial
              </Label>
              <Input
                id="lastInitial"
                value={lastInitial}
                onChange={(e) => setLastInitial(e.target.value)}
                className="col-span-3"
                maxLength={1}
              />
            </div>
          </div>
          <Button onClick={handleNameSubmit}>Join Group</Button>
        </DialogContent>
      </Dialog>

      <SpeechRecognition
        onResult={handleSpeechRecognitionResult}
        isActive={isSpeechRecognitionActive}
      />
      <AudioCapture
        onAudioInput={handleAudioInput}
        isActive={isAudioCapturing}
      />
    </div>
  );
}