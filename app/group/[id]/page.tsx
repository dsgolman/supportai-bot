"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getChannel, createPeerConnection } from '@/utils/socket';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Howl } from 'howler';
import { v4 as uuidv4 } from 'uuid';
import SpeechRecognition from '@/components/SpeechRecognition'; // Adjust the path as needed
import { createClient } from '@/utils/supabase/client'; // Adjust the path as needed

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
  const { id: groupId } = useParams();
  const [internalChannel, setInternalChannel] = useState<any>(null);
  const [humeChannel, setHumeChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('');
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const supabase = createClient();

  // Function to insert a group member into Supabase
  // const insertGroupMember = async (groupId: string, userId: string) => {
  //   try {
  //     const { error } = await supabase
  //       .from('group_members')
  //       .insert({ group_id: groupId, user_id: userId });

  //     if (error) {
  //       console.error('Error inserting group member:', error);
  //     } else {
  //       console.log('Group member inserted.');
  //     }
  //   } catch (error) {
  //     console.error('Unexpected error inserting group member:', error);
  //   }
  // };

  // Function to fetch group members from Supabase
  // const fetchGroupMembers = async (groupId: string) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('group_members')
  //       .select('*, users(*)') // Fetch associated user details
  //       .eq('group_id', groupId);

  //     if (error) {
  //       console.error('Error fetching group members:', error);
  //     } else {
  //       const participantsData = data.map((member: any) => ({
  //         id: member.user_id,
  //         name: member.users.name,
  //         avatar: member.users.avatar_url,
  //         isSpeaking: false,
  //         isBot: member.user_id === 'bot',
  //         role: 'listener', // Set role based on your logic
  //       }));
  //       setParticipants(participantsData);
  //     }
  //   } catch (error) {
  //     console.error('Unexpected error fetching group members:', error);
  //   }
  // };

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        if (user) {
          setUserId(user.id);
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const initializeChannels = async () => {
      try {
        let { webrtcChannel, eviChannel } = getChannel(userId, groupId!);
        setInternalChannel(webrtcChannel);
        setHumeChannel(eviChannel);

        const pc = createPeerConnection(webrtcChannel);
        setPeerConnection(pc);

        // if (groupId && userId) {
          // await insertGroupMember(groupId, userId);
          // await fetchGroupMembers(groupId);
        // }

        const handleNewMessage = (payload: { body: string, user_id: string }) => {
          addMessage(payload.user_id, payload.body);
          updateParticipantSpeakingStatus(payload.user_id, true);
        };

        const handleBotMessage = (payload: { message: string }) => {
          addMessage('bot', payload.message);
          updateParticipantSpeakingStatus('bot', true);
        };

        const unlockMicrophone = (payload: { userId: string }) => {
          updateParticipantSpeakingStatus(payload.userId, true);
          setActiveSpeaker(payload.userId);
        };

        const handleAudioOutput = (payload: { data: string }) => {
          const audioData = `data:audio/wav;base64,${payload.data}`;
          audioQueueRef.current.push(audioData);
          if (!isPlayingRef.current) {
            playNextAudio();
          }
        };

        eviChannel.on("new_message", handleNewMessage);
        eviChannel.on("bot_message", handleBotMessage);
        eviChannel.on("active_speaker", unlockMicrophone);
        eviChannel.on("audio_output", handleAudioOutput);

        eviChannel.on("message", (payload: { content: string }) => {
          addMessage('bot', payload.content);
        });

        webrtcChannel.on("offer", async (payload: { sdp: RTCSessionDescriptionInit }) => {
          await pc.setRemoteDescription(payload.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          webrtcChannel.push("answer", { sdp: answer });
        });

        webrtcChannel.on("answer", async (payload: { sdp: RTCSessionDescriptionInit }) => {
          await pc.setRemoteDescription(payload.sdp);
        });

        webrtcChannel.on("ice_candidate", (payload: { candidate: RTCIceCandidateInit }) => {
          pc.addIceCandidate(payload.candidate);
        });

        return () => {
          humeChannel.off("new_message", handleNewMessage);
          humeChannel.off("bot_message", handleBotMessage);
          humeChannel.off("audio_output", handleAudioOutput);
          humeChannel.leave();
          pc.close();
        };
      } catch (error) {
        console.error("Error initializing channels:", error);
      }
    };

    if (userId && groupId) {
      initializeChannels();
    }
  }, [userId, groupId]);

  const startCall = async () => {
    if (!peerConnection || !internalChannel) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      internalChannel.push("offer", { sdp: offer });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  function addMessage(userId: string | null, content: string) {
    if (!userId || !groupId) return; // Ensure both userId and groupId are defined
    
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: uuidv4(),
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        group_id: typeof groupId === 'string' ? groupId : null // Ensure groupId is a string
      }
    ]);
  }
  

  const updateParticipantSpeakingStatus = (userId: string | null, isSpeaking: boolean) => {
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
  };

  const raiseHand = () => {
    if (!humeChannel || !userId || !groupId) return;
    humeChannel.push("raise_hand", { userId, groupId })
      .receive("ok", (resp: any) => {
        console.log("Hand raised:", resp);
        setHandRaised(true);
      })
      .receive("error", (err: any) => {
        console.error("Error raising hand:", err);
      });
  };

  const lowerHand = () => {
    if (!humeChannel || !userId || !groupId) return;
    humeChannel.push("lower_hand", { userId, groupId })
      .receive("ok", (resp: any) => {
        console.log("Hand lowered:", resp);
        setHandRaised(false);
      })
      .receive("error", (err: any) => {
        console.error("Error lowering hand:", err);
      });
  };

  const sendMessage = (content: string) => {
    if (humeChannel) {
      humeChannel.push("user_message", { type: "text", content })
        .receive("ok", (resp: any) => {
          console.log("Message sent:", resp);
        })
        .receive("error", (err: any) => {
          console.error("Error sending message:", err);
        });
    }
  };
  const handleSpeechRecognitionResult = (transcript: string) => {
    if (userId) {
      addMessage(userId, transcript);
      sendMessage(transcript)
    }
  };

  return (
    <div className="p-4">
      <div className="flex">
        {/* Chat Display */}
        <div className="w-2/3 pr-4">
          <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-auto" ref={scrollAreaRef}>
            {messages.map(message => (
              <div key={message.id} className={`p-2 ${message.user_id === 'bot' ? 'bg-gray-200' : 'bg-white'}`}>
                <div><strong>{message.user_id}</strong>: {message.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants List */}
        <div className="w-1/3">
          <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-auto">
            <h3 className="text-lg font-semibold">Participants</h3>
            {participants.map(participant => (
              <div key={participant.id} className="flex items-center p-2">
                <Avatar>
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <div className="font-medium">{participant.name}</div>
                  {participant.isSpeaking && <div className="text-green-500">Speaking</div>}
                  {participant.isBot && <div className="text-red-500">Bot</div>}
                  <div className="text-sm">{participant.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Speech Recognition and Control */}
      <div className="mt-4 flex space-x-4">
        {activeSpeaker === userId ? <SpeechRecognition onResult={handleSpeechRecognitionResult} /> : (
          <>
            <Button onClick={startCall}>Start Call</Button>
            {!handRaised ? (
              <Button onClick={raiseHand}>Raise Hand</Button>
            ) : (
              <Button onClick={lowerHand}>Lower Hand</Button>
            )}
            
          </>
        )}
      </div>
    </div>
  );
};

export default GroupAudioRoom;
