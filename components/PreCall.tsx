"use client";

import { useCallback, useEffect, useState } from "react";
import { Ear, Loader2 } from "lucide-react";
import { VoiceEvent, VoiceMessage } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent, useVoiceClientTransportState, useVoiceClientMediaTrack } from "realtime-ai-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
// import { Configure } from "./Configure";
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
  const [isGroupStarted, setIsGroupStarted] = useState<boolean>(false);
  const { assistant } = useAssistant();
  const supabase = createClient();

  const groupId = assistant?.id;
  const botAudioTrack = useVoiceClientMediaTrack("audio", "bot");

  const clearGroupData = async () => {
    if (!groupId) return;

    try {
      // Clear messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('group_id', groupId);

      if (messagesError) {
        console.error('Error clearing messages:', messagesError);
        return;
      }

      // Clear raised hands
      const { error: handsError } = await supabase
        .from('raised_hands')
        .delete()
        .eq('group_id', groupId);

      if (handsError) {
        console.error('Error clearing raised hands:', handsError);
        return;
      }

      console.log('All group data cleared.');
    } catch (error) {
      console.error('Unexpected error clearing group data:', error);
    }
  };

  const clearGroupState = async () => {
    if (!groupId) return;

    try {
      const { error } = await supabase
        .from('call_state')
        .delete()
        .eq('group_id', groupId);

      if (error) {
        console.error('Error clearing group state:', error);
      } else {
        console.log('Group state cleared.');
      }
    } catch (error) {
      console.error('Unexpected error clearing group state:', error);
    }
  };

  const insertGroupMember = async (userId: string) => {
    if (!groupId) return;

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

  const checkGroupState = async () => {
    if (!groupId) return;

    try {
      const { data: existingData, error: existingError } = await supabase
        .from('call_state')
        .select('first_user_id')
        .eq('group_id', groupId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is the code for "No rows found"
        console.error('Error checking existing group state:', existingError);
        setIsFirstUser(false);
        setIsGroupStarted(false);
        return;
      }

      if (existingData) {
        setIsFirstUser(existingData.first_user_id === userId);
        setIsGroupStarted(true); // Group has started
      } else {
        setIsGroupStarted(false); // Group has not started yet
      }
    } catch (error) {
      console.error('Unexpected error in checkGroupState:', error);
      setIsFirstUser(false);
      setIsGroupStarted(false);
    }
  };

  useEffect(() => {
    if (isGroupChat && groupId) {
      checkGroupState();
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

  async function start() {
    if (!voiceClient) return;
    try {
      if (!isGroupChat) {
        voiceClient.enableMic(true);
        await voiceClient.start();
      } else if (isGroupChat && isFirstUser) {
        voiceClient.enableMic(true);
        await voiceClient.start();
      } else {

        // const req = await fetch("http://localhost:7860/add-participant", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     // Include any necessary authentication headers if required by Pipecat
        //     // Authorization: `Bearer ${process.env.PIPECAT_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     room_url: "https://supportaiv.daily.co/mental-health",
        //     participant_name: "test"
        //   }),
        // }); 

        // console.log("Fetch request status:", req.status);
        // const res = await req.json();
        // console.log("Response from Pipecat:", res);

        setAppState("connected");
      }
    } catch (e) {
      voiceClient.disconnect();
    }
  }

  async function leave() {
    if (!voiceClient) return;
    await voiceClient.disconnect();
    // Clear group state when leaving
    await clearGroupState();
    onComplete();
  }

  // Detect when a new user joins and insert them into the group_members table
  useEffect(() => {
    if (isGroupChat && groupId && !isFirstUser) {
      insertGroupMember(userId);
    }
  }, [isGroupStarted, isFirstUser, groupId, userId]);

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
    <Card id="precall-card" className="w-full max-w-md mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm border-none shadow-lg">
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

      </CardContent>
      <CardFooter id="card-footer">
        <Button
          key="start"
          onClick={() => start()}
          disabled={!isReady}
        >
          {!isReady && <Loader2 className="animate-spin" />}
          {isGroupChat ? (isGroupStarted ? "Join Group" : "Start Group") : status_text[transportState as keyof typeof status_text]}
        </Button>
      </CardFooter>
    </Card>
  );
}
