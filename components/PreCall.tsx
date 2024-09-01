"use client";

import { useCallback, useEffect, useState } from "react";
import { Ear, Loader2 } from "lucide-react";
import { VoiceEvent, VoiceMessage } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent, useVoiceClientTransportState, useVoiceClientMediaTrack } from "realtime-ai-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Configure } from "./Configure";
import Session from "./Session";
import { useAssistant } from "@/components/assistantContext";
import { Alert } from "./ui/alert";
import { GroupChat } from "@/components/GroupChat";
import { createClient } from '@/utils/supabase/client';

const status_text = {
  idle: "Initializing...",
  initializing: "Initializing...",
  initialized: "Start",
  authenticating: "Requesting bot...",
  connecting: "Connecting...",
};

export function PreCall({ isGroupChat, userId, onComplete }: { isGroupChat: boolean, userId: string, onComplete: () => void }) {
  const voiceClient = useVoiceClient();
  const transportState = useVoiceClientTransportState();
  const [appState, setAppState] = useState<"idle" | "ready" | "connecting" | "connected">("idle");
  const [error, setError] = useState<string | null>(null);
  const [startAudioOff, setStartAudioOff] = useState<boolean>(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean>(false);
  const { assistant } = useAssistant();
  const supabase = createClient();

  const groupId = assistant?.id;
  const botAudioTrack = useVoiceClientMediaTrack("audio", "bot");


  const checkFirstUser = async () => {
    if (!groupId) return;

    try {
      // Check if the record already exists
      const { data: existingData, error: existingError } = await supabase
        .from('call_state')
        .select('first_user_id')
        .eq('group_id', groupId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is the code for "No rows found"
        console.error('Error checking existing first user:', existingError);
        setIsFirstUser(false);
        return;
      }

      if (existingData) {
        // Record exists, set isFirstUser based on the existing first_user_id
        setIsFirstUser(existingData.first_user_id === userId);
      } else {
        // Record does not exist, insert a new record
        const { data, error } = await supabase
          .from('call_state')
          .insert({ group_id: groupId, first_user_id: userId })
          .select('first_user_id')
          .single();

        if (error) {
          console.error('Error setting first user:', error);
          setIsFirstUser(false);
        } else {
          setIsFirstUser(data.first_user_id === userId);
        }
      }
    } catch (error) {
      console.error('Unexpected error in checkFirstUser:', error);
      setIsFirstUser(false);
    }
  };

  // Call the checkFirstUser function when the component mounts or when groupId, userId, or isGroupChat changes
  useEffect(() => {
    if (isGroupChat && groupId) {
      checkFirstUser();
    }
  }, [groupId, userId, isGroupChat, supabase]);


  const handleError = useCallback((message: VoiceMessage) => {
    const errorData = message.data as { error: string; fatal: boolean };
    if (errorData.fatal) {
      setError(errorData.error);
    }
  }, []);

  useVoiceClientEvent(VoiceEvent.Error, handleError);

  useEffect(() => {
    if (!voiceClient || appState !== "idle") return;
    voiceClient.initDevices();
  }, [appState, voiceClient]);

  useEffect(() => {
    switch (transportState) {
      case "initialized":
        setAppState("ready");
        break;
      case "authenticating":
      case "connecting":
        setAppState("idle");
        break;
      case "connected":
      case "ready":
        setAppState("connected");
        break;
      default:
        setAppState("idle");
    }
  }, [transportState]);

  useEffect(() => {
    if (botAudioTrack && isFirstUser) {
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
  }, [botAudioTrack, groupId, isFirstUser]);

  async function start() {
    if (!voiceClient) return;
    try {
      console.log(isFirstUser);
      voiceClient.enableMic(false);
      if (!isGroupChat) {
        await voiceClient.start();
      } else if (isGroupChat && isFirstUser) {
        await voiceClient.start();
      } else {
        setAppState("connected");
      }
    } catch (e) {
      voiceClient.disconnect();
    }
  }

  async function leave() {
    if (!voiceClient) return;
    await voiceClient.disconnect();
    onComplete();
  }

  if (error) {
    return (
      <Card id="error-card" className="animate-appear max-w-lg">
        <CardContent>
          <Alert intent="danger" title="An error occurred" id="error-alert">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (appState === "connected") {
    if (isGroupChat && groupId) {
      return <GroupChat groupId={groupId} userId={userId} isFirstUser={isFirstUser} />;
    } else {
      return (
        <div className="flex h-screen items-center justify-center" id="session-container">
          <Session
            state={transportState}
            onLeave={() => leave()}
            startAudioOff={startAudioOff}
          />
        </div>
      );
    }
  }

  const isReady = appState === "ready";

  return (
    <Card id="precall-card" className="animate-appear max-w-lg">
      <CardHeader id="card-header">
        <CardTitle id="card-title">{assistant?.name || "Onboarding Assistant"}</CardTitle>
        <CardDescription id="card-description">
          {assistant?.description || "Speak with our AI onboarding assistant"}
        </CardDescription>
      </CardHeader>
      <CardContent id="card-content">
        <div className="flex flex-row gap-2 bg-primary-50 px-4 py-2 md:p-2 text-sm items-center justify-center rounded-md font-medium text-pretty" id="status-info">
          <Ear className="size-7 md:size-5 text-primary-400" />
          Works best in a quiet environment with a good internet connection.
        </div>
        <Configure
          startAudioOff={startAudioOff}
          handleStartAudioOff={() => setStartAudioOff(!startAudioOff)}
          state={appState}
        />
      </CardContent>
      <CardFooter id="card-footer">
        <Button
          key="start"
          onClick={() => start()}
          disabled={!isReady}
        >
          {!isReady && <Loader2 className="animate-spin" />}
          {status_text[transportState as keyof typeof status_text]}
        </Button>
      </CardFooter>
    </Card>
  );
}