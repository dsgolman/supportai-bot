"use client"

import React, { useRef, useState, useEffect } from 'react';
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";

import Onboarding from '@/components/Onboarding';
import { signup } from '../login/actions';
import { AssistantProvider, useAssistant } from '@/components/assistantContext';
import { PreCall } from "@/components/PreCall";
import { BOT_READY_TIMEOUT, defaultConfig, defaultServices } from "@/rtvi.config";

const OnboardingPage: React.FC = () => {
  const { assistant } = useAssistant();
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const voiceClientRef = useRef<DailyVoiceClient | null>(null);

  useEffect(() => {
    if (voiceClientRef.current || !assistant) {
      return;
    }

    const voiceClient = new DailyVoiceClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "/api",
      services: defaultServices,
      config: defaultConfig,
      timeout: BOT_READY_TIMEOUT,
    });

    voiceClientRef.current = voiceClient;
    setVoiceClient(voiceClient);
  }, [assistant]);

  if (!voiceClient && assistant) {
    return <div>Loading...</div>;
  }

  return (
    <AssistantProvider>
      {voiceClient && (
        <VoiceClientProvider voiceClient={voiceClientRef.current!}>
          <TooltipProvider>
            <main>
              <div id="app">
                <Onboarding signup={signup} />
              </div>
            </main>
            <aside id="tray" />
          </TooltipProvider>
          <VoiceClientAudio />
        </VoiceClientProvider>
      )}
    </AssistantProvider>
  );
};

export default OnboardingPage;