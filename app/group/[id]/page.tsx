"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getChannel } from '@/utils/socket';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Howl } from 'howler';
import { Users, Bot, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
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
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'bot', name: 'AI Assistant', avatar: '/bot-avatar.png', isSpeaking: false, isBot: true, role: 'speaker' },
    { id: 'user1', name: 'You', avatar: '/user-avatar.png', isSpeaking: false, isBot: false, role: 'speaker' },
    { id: 'user2', name: 'Alice', avatar: '/alice-avatar.png', isSpeaking: false, isBot: false, role: 'listener' },
    { id: 'user3', name: 'Bob', avatar: '/bob-avatar.png', isSpeaking: false, isBot: false, role: 'listener' },
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('');

  const supabase = createClient();

// Function to insert a group member into Supabase
const insertGroupMember = async (groupId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId });

    if (error) {
      console.error('Error inserting group member:', error);
    } else {
      console.log('Group member inserted.');
    }
  } catch (error) {
    console.error('Unexpected error inserting group member:', error);
  }
};

// Function to fetch group members from Supabase
const fetchGroupMembers = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      console.error('Error fetching group members:', error);
    } else {
      console.log('Group members retrieved:', data);
    }
  } catch (error) {
    console.error('Unexpected error fetching group members:', error);
  }
};

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        // Fetch the user's full name and session count
        if (user) {
          setUserId(user.id);
        }
      } else {
        
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    const initializeChannel = async () => {
      try {
        const ch = getChannel(userId, groupId!);
        setChannel(ch);

        // Insert the new member into the group_members table
        if (groupId && userId) {
          await insertGroupMember(groupId, userId);
          await fetchGroupMembers(groupId); // Optionally update the participant list from Supabase
        }

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
          setActiveSpeaker(userId);
        };

        const handleAudioOutput = (payload: { data: string }) => {
          const audioData = `data:audio/wav;base64,${payload.data}`;
          audioQueueRef.current.push(audioData);
          if (!isPlayingRef.current) {
            playNextAudio();
          }
        };

        ch.on("new_message", handleNewMessage);
        ch.on("bot_message", handleBotMessage);
        ch.on("user_raised_hand", unlockMicrophone);
        ch.on("audio_output", handleAudioOutput);

        return () => {
          ch.off("new_message", handleNewMessage);
          ch.off("bot_message", handleBotMessage);
          ch.off("audio_output", handleAudioOutput);
          ch.leave();
        };
      } catch (error) {
        console.error("Error initializing channel:", error);
      }
    };

    initializeChannel();
  }, [userId, groupId]);

  function addMessage(userId: string | null, content: string) {
    if (!userId) return;
    setMessages(prevMessages => [
      ...prevMessages,
      { id: uuidv4(), user_id: userId, content, created_at: new Date().toISOString(), group_id: groupId }
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
    updateParticipantSpeakingStatus('bot', true);
    const audioData = audioQueueRef.current.shift()!;

    const sound = new Howl({
      src: [audioData],
      format: ['wav'],
      onend: () => {
        playNextAudio();
      },
    });

    sound.play();
  };

  const raiseHand = () => {
    if (!channel || !userId || !groupId) return;
    channel.push("raise_hand", { userId, groupId })
      .receive("ok", (resp: any) => {
        console.log("Hand raise sent successfully:", resp);
      })
      .receive("error", (resp: any) => {
        console.log("Failed to raise hand:", resp);
      });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="mr-2" /> Audio Room
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Speakers</h3>
              {participants.filter(p => p.role === 'speaker').map(participant => (
                <div key={participant.id}>
                  <Avatar className={`w-16 h-16 ${participant.isSpeaking ? 'ring-2 ring-primary' : ''}`}>
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback>{participant.isBot ? <Bot /> : <User />}</AvatarFallback>
                  </Avatar>
                  <span>{participant.name}</span>
                  {participant.isSpeaking && <span className="text-primary animate-pulse">Speaking</span>}
                </div>
              ))}
            </div>
            <Button onClick={raiseHand}>Raise Hand</Button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Listeners</h3>
              {participants.filter(p => p.role === 'listener').map(participant => (
                <div key={participant.id}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback>{participant.isBot ? <Bot /> : <User />}</AvatarFallback>
                  </Avatar>
                  <span>{participant.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupAudioRoom;
