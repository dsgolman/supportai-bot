'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getChannel } from '@/utils/socket';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Howl } from 'howler';
import { v4 as uuidv4 } from 'uuid';
import SpeechRecognition from '@/components/SpeechRecognition';
import { createClient } from '@/utils/supabase/client';
import { Clock, Wifi, WifiOff, Mic, MicOff } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

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

export default function GroupAudioRoom() {
  const { id: groupId } = useParams();
  const [humeChannel, setHumeChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [canRaiseHand, setCanRaiseHand] = useState(false);
  const [raiseHandCountdown, setRaiseHandCountdown] = useState<number | null>(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [channelJoined, setChannelJoined] = useState(false);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState<number>(120); // 2 minutes in seconds

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const joinTimeRef = useRef<Date | null>(null);
  const reconnectAttempts = useRef(0);
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
  }, []);

  const fetchParticipants = useCallback(async () => {
    if (!groupId) return;
    
    const { data: existingParticipants, error: participantsError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return;
    }

    if (existingParticipants) {
      setParticipants(existingParticipants.map(p => ({
        id: p.user_id,
        name: p.profiles && p.profiles[0] ? p.profiles[0].full_name || 'Unknown' : 'Unknown',
        avatar: p.profiles && p.profiles[0] ? p.profiles[0].avatar_url || '' : '',
        isSpeaking: false,
        isBot: false,
        role: 'listener'
      })));
    }
  }, [groupId, supabase]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    if (isInCall && !hasJoinedBefore) {
      joinTimeRef.current = new Date();
      setHasJoinedBefore(true);
    }

    if (isInCall && joinTimeRef.current) {
      const updateCountdown = () => {
        const now = new Date();
        const timeDiff = Math.floor((now.getTime() - joinTimeRef.current!.getTime()) / 1000);
        const remainingTime = Math.max(10 - timeDiff, 0);
        setRaiseHandCountdown(remainingTime);
        
        if (remainingTime === 0) {
          setCanRaiseHand(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      };

      updateCountdown();
      timerRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isInCall, hasJoinedBefore]);

  useEffect(() => {
    if (activeSpeaker === userId) {
      setSpeakingTimeLeft(120);
      speakingTimerRef.current = setInterval(() => {
        setSpeakingTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(speakingTimerRef.current!);
            stopSpeaking();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
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

  const addMessage = useCallback((userId: string | null, content: string) => {
    if (!userId || !groupId) return;
    
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

  const updateParticipantSpeakingStatus = useCallback((userId: string | null, isSpeaking: boolean) => {
    setParticipants(prevParticipants =>
      prevParticipants.map(p =>
        p.id === userId ? { ...p, isSpeaking } : p
      )
    );
  }, []);

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

  const initializeChannel = useCallback(async () => {
    if (!userId || !groupId) return;

    try {
      setConnectionStatus('connecting');
      let { eviChannel } = getChannel(userId, groupId);
      setHumeChannel(eviChannel);

      eviChannel.on("new_message", (payload: { body: string, user_id: string }) => {
        addMessage(payload.user_id, payload.body);
        updateParticipantSpeakingStatus(payload.user_id, true);
      });

      eviChannel.on("bot_message", (payload: { message: string }) => {
        addMessage('bot', payload.message);
        updateParticipantSpeakingStatus('bot', true);
      });

      eviChannel.on("active_speaker", (payload: { userId: string, groupId: string, tool_call_id: string }) => {
        sendToolCallResponseMessage(payload.tool_call_id);
        console.log(`Unlocked microphone for user: ${payload.userId}`);
        console.log(`Tool Call ID: ${payload.tool_call_id}`);
        updateParticipantSpeakingStatus(payload.userId, true);
        setActiveSpeaker(payload.userId);
      });

      eviChannel.on("audio_output", (payload: { data: string }) => {
        const audioData = `data:audio/wav;base64,${payload.data}`;
        audioQueueRef.current.push(audioData);
        if (!isPlayingRef.current) {
          playNextAudio();
        }
      });

      eviChannel.on("user_joined", (payload: { userId: string, groupId: string }) => {
        console.log("User joined:", payload);
        fetchParticipants();
      });

      eviChannel.on("user_left", (payload: { userId: string, groupId: string }) => {
        console.log("User left:", payload);
        fetchParticipants();
      });

      eviChannel.onError(() => {
        console.error("Channel error");
        setConnectionStatus('disconnected');
        setChannelJoined(false);
        toast({
          title: "Connection Error",
          description: "There was an error connecting to the audio room. Please try again.",
          variant: "destructive",
        });
      });

      eviChannel.onClose(() => {
        console.log("Channel closed");
        setConnectionStatus('disconnected');
        setChannelJoined(false);
        reconnect();
      });

      eviChannel.join()
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Joined EviBot channel:", resp);
          setChannelJoined(true);
          setConnectionStatus('connected');
          reconnectAttempts.current = 0;
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error joining EviBot channel:", err);
          setConnectionStatus('disconnected');
          setChannelJoined(false);
          toast({
            title: "Join Error",
            description: "Failed to join the audio room. Please try again.",
            variant: "destructive",
          });
        });

      return () => {
        eviChannel.leave();
        setChannelJoined(false);
      };
    } catch (error) {
      console.error("Error initializing channel:", error);
      setConnectionStatus('disconnected');
      setChannelJoined(false);
      toast({
        title: "Connection Error",
        description: "Failed to initialize the audio room. Please try again later.",
        variant: "destructive",
      });
    }
  }, [userId, groupId, addMessage, updateParticipantSpeakingStatus, playNextAudio, fetchParticipants]);

  const reconnect = useCallback(() => {
    if (reconnectAttempts.current < 5) {
      setTimeout(() => {
        console.log(`Attempting to reconnect... (Attempt ${reconnectAttempts.current + 1})`);
        initializeChannel();
        reconnectAttempts.current++;
      }, 5000 * (reconnectAttempts.current + 1)); // Exponential backoff
    } else {
      console.log("Max reconnection attempts reached");
      setIsInCall(false);
      toast({
        title: "Connection Lost",
        description: "Unable to reconnect to the audio room. Please try joining again.",
        variant: "destructive",
      });
    }
  }, [initializeChannel]);

  useEffect(() => {
    if (userId && groupId) {
      initializeChannel();
    }
  }, [userId, groupId, initializeChannel]);

  useEffect(() => {
    const autoJoin = async () => {
      if (userId && participants.some(p => p.id === userId) && !isInCall && connectionStatus === 'connected' && channelJoined) {
        await joinCall();
      }
    };

    autoJoin();
  }, [userId, participants, isInCall, connectionStatus, channelJoined]);

  const joinCall = async () => {
    console.log("Joining call...");
    if (!humeChannel || !userId || !groupId || !channelJoined) return;

    try {
      humeChannel.push("start_call", { groupId })
        .receive("ok", async (resp: { [key: string]: any }) => {
          console.log("Started call:", resp);
          setIsListening(true);
          setIsInCall(true);
          if (!hasJoinedBefore) {
            setRaiseHandCountdown(10);
            setCanRaiseHand(false);
          }
          toast({
            title: "Joined Call",
            description: "You have successfully joined the audio room.",
          });
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error starting call:", err);
          toast({
            title: "Join Error",
            description: "Failed to join the audio room. Please try again.",
            variant: "destructive",
          });
        });
    } catch (error) {
      console.error("Error joining call:", error);
      toast({
        title: "Join Error",
        description: "An unexpected error occurred while joining the call.",
        variant: "destructive",
      });
    }
  };

  const leaveCall = async () => {
    if (!humeChannel || !userId || !groupId || !channelJoined) return;

    try {
      humeChannel.push("leave", {})
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Left call successfully:", resp);
          setIsInCall(false);
          setIsListening(false);
          setActiveSpeaker('');
          setCanRaiseHand(false);
          setRaiseHandCountdown(null);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          joinTimeRef.current = null;
          setHasJoinedBefore(false);
          toast({
            title: "Left Call",
            description: "You have successfully left the audio room.",
          });
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Failed to leave call:", err);
          toast({
            title: "Leave Error",
            description: "Failed to leave the audio room. Please try again.",
            variant: "destructive",
          });
        });
    } catch (error) {
      console.error("Error leaving call:", error);
      toast({
        title: "Leave Error",
        description: "An unexpected error occurred while leaving the call.",
        variant: "destructive",
      });
    }
  };

  const raiseHand = () => {
    if (!humeChannel || !userId || !groupId || !canRaiseHand || !channelJoined) return;
    sendMessage(`${userId} has raised their hand in group ${groupId}`);
    setHandRaised(true);
    toast({
      title: "Hand Raised",
      description: "You have raised your hand.",
    });
  };

  const lowerHand = () => {
    if (!humeChannel || !userId || !groupId || !channelJoined) return;
    sendMessage(`${userId} has lowered their hand in group ${groupId}`);
    setHandRaised(false);
    toast({
      title: "Hand Lowered",
      description: "You have lowered your hand.",
    });
  };

  const sendMessage = (content: string) => {
    if (humeChannel && channelJoined) {
      humeChannel.push("user_message", { type: "text", content })
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Message sent:", resp);
          addMessage(userId, content);
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error sending message:", err);
          toast({
            title: "Message Error",
            description: "Failed to send your message. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  const sendToolCallResponseMessage = (content: string) => {
    console.log("Sending tool call response message:", content);
    if (humeChannel && channelJoined) {
      humeChannel.push("user_message", { type: "tool_response", content })
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Tool response sent:", resp);
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error sending tool response:", err);
          toast({
            title: "Response Error",
            description: "Failed to send your response. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  const handleSpeechRecognitionResult = (transcript: string) => {
    if (userId) {
      sendMessage(transcript);
    }
  };

  const stopSpeaking = () => {
    if (humeChannel && channelJoined) {
      humeChannel.push("stop_speaking", { userId })
        .receive("ok", (resp: { [key: string]: any }) => {
          console.log("Stopped speaking:", resp);
          setActiveSpeaker('');
          updateParticipantSpeakingStatus(userId, false);
          toast({
            title: "Stopped Speaking",
            description: "You have stopped speaking.",
          });
        })
        .receive("error", (err: { [key: string]: any }) => {
          console.error("Error stopping speaking:", err);
          toast({
            title: "Stop Speaking Error",
            description: "Failed to stop speaking. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-6 bg-gray-200">
            <h2 className="text-2xl font-bold">Group Audio Room</h2>
            <div className="flex items-center">
              {connectionStatus === 'connected' ? (
                <Wifi className="text-green-500 mr-2" />
              ) : connectionStatus === 'connecting' ? (
                <Wifi className="text-yellow-500 mr-2" />
              ) : (
                <WifiOff className="text-red-500 mr-2" />
              )}
              <span>{connectionStatus}</span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-2/3 p-6">
              <div className="bg-gray-50 p-4 rounded-lg h-[calc(100vh-300px)] overflow-auto" ref={scrollAreaRef}>
                {messages.map(message => (
                  <div key={message.id} className={`p-3 mb-3 rounded-lg ${message.user_id === 'bot' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <div className="font-semibold">{message.user_id === 'bot' ? 'Facilitator' : message.user_id}</div>
                    <div>{message.content}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-1/3 p-6 border-l">
              <h3 className="text-xl font-semibold mb-4">Participants</h3>
              <div className="space-y-3">
                {participants.map(participant => (
                  <div key={participant.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback>{participant.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-gray-500">
                        {participant.isSpeaking && <span className="text-green-500 mr-2">Speaking</span>}
                        {participant.isBot && <span className="text-blue-500 mr-2">Facilitator</span>}
                        <span>{participant.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t">
            {activeSpeaker === userId ? (
              <div className="space-y-4">
                <SpeechRecognition onResult={handleSpeechRecognitionResult} />
                <div className="flex items-center justify-between">
                  <Button onClick={stopSpeaking} className="bg-red-500 hover:bg-red-600 text-white">
                    <MicOff className="mr-2 h-4 w-4" /> Stop Speaking
                  </Button>
                  <div className="text-lg font-semibold">
                    Time left: {Math.floor(speakingTimeLeft / 60)}:{(speakingTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {!isInCall ? (
                  <Button 
                    onClick={joinCall} 
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={connectionStatus !== 'connected' || !channelJoined}
                  >
                    Join Call
                  </Button>
                ) : (
                  <>
                    <Button onClick={leaveCall} className="bg-red-500 hover:bg-red-600 text-white">
                      Leave Call
                    </Button>
                    {canRaiseHand ? (
                      !handRaised ? (
                        <Button 
                          onClick={raiseHand} 
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!channelJoined}
                        >
                          Raise Hand
                        </Button>
                      ) : (
                        <Button 
                          onClick={lowerHand} 
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          disabled={!channelJoined}
                        >
                          Lower Hand
                        </Button>
                      )
                    ) : (
                      <div className="flex items-center text-gray-600">
                        <Clock className="mr-2" />
                        <span>
                          {raiseHandCountdown !== null
                            ? `You can raise your hand in ${raiseHandCountdown} seconds`
                            : 'Joining call...'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}