"use client"

import React, { useRef, useState, useEffect } from 'react';
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";

import Onboarding from '@/components/Onboarding';
import { signup } from '../login/actions';
import { AssistantProvider, useAssistant } from '@/components/assistantContext';
import { BOT_READY_TIMEOUT, defaultConfig, defaultServices, PRESET_ASSISTANTS } from "@/rtvi.config";

interface ConfigOption {
  name: string;
  value: any;
}

interface ConfigItem {
  service: string;
  options: ConfigOption[];
}

function OnboardingPageContent() {
  const { assistant, setAssistant } = useAssistant();
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const voiceClientRef = useRef<DailyVoiceClient | null>(null);

  const updateConfigWithAssistantData = (config: ConfigItem[], assistantData: typeof PRESET_ASSISTANTS[0]): ConfigItem[] => {
    const updatedConfig = JSON.parse(JSON.stringify(config));

    updatedConfig.forEach((item: ConfigItem) => {
      if (item.service === "tts") {
        item.options.forEach((option: ConfigOption) => {
          if (option.name === "voice") {
            option.value = assistantData.voice;
          }
        });
      }
      if (item.service === "llm") {
        item.options.forEach((option: ConfigOption) => {
          if (option.name === "initial_messages") {
            option.value[0].content = assistantData.prompt;
          }
        });
      }
    });

    return updatedConfig;
  };

  useEffect(() => {
    if (!assistant) {
      const onboardingAssistant = PRESET_ASSISTANTS.find(a => a.name === "Daily Onboarding Bot");
      if (onboardingAssistant) {
        setAssistant(onboardingAssistant);
      }
    }
  }, [assistant, setAssistant]);

  useEffect(() => {
    if (voiceClientRef.current || !assistant) {
      return;
    }

    const voiceClient = new DailyVoiceClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "/api",
      services: defaultServices,
      config: updateConfigWithAssistantData(defaultConfig, assistant),
      timeout: BOT_READY_TIMEOUT,
    });

    voiceClientRef.current = voiceClient;
    setVoiceClient(voiceClient);
  }, [assistant]);

  if (!voiceClient && assistant) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {voiceClient && (
        <VoiceClientProvider voiceClient={voiceClientRef.current!}>
          <TooltipProvider>
            <main>
              <div id="app">
                <Onboarding />
              </div>
            </main>
            <aside id="tray" />
          </TooltipProvider>
          <VoiceClientAudio />
        </VoiceClientProvider>
      )}
    </>
  );
}

const OnboardingPage: React.FC = () => {
  return (
    <AssistantProvider>
      <OnboardingPageContent />
    </AssistantProvider>
  );
};

export default OnboardingPage;