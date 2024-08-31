"use client"

import React, { useRef, useState, useEffect } from 'react';
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";

import Onboarding from '@/components/Onboarding';
import { AssistantProvider, useAssistant } from '@/components/assistantContext';
import { BOT_READY_TIMEOUT, defaultConfig, defaultServices, PRESET_ASSISTANTS } from "@/rtvi.config";
import { createClient } from "@/utils/supabase/client";
import { redirect } from 'next/navigation';

const DashboardPage: React.FC = () => {
  const { assistant, setAssistant } = useAssistant();
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const voiceClientRef = useRef<DailyVoiceClient | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        // Check if user has completed onboarding
        supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setIsOnboarded(data.is_onboarded);
            }
          });
      } else {
        // Redirect to login if not authenticated
        redirect('/login');
      }
    });
  }, []);

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
      config: defaultConfig,
      timeout: BOT_READY_TIMEOUT,
    });

    voiceClientRef.current = voiceClient;
    setVoiceClient(voiceClient);
  }, [assistant]);

  const handleOnboardingComplete = async () => {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ is_onboarded: true })
      .eq('id', user.id);
    setIsOnboarded(true);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!isOnboarded) {
    return (
      <AssistantProvider>
        {voiceClient && (
          <VoiceClientProvider voiceClient={voiceClientRef.current!}>
            <TooltipProvider>
              <main>
                <div id="app">
                  <Onboarding onComplete={handleOnboardingComplete} />
                </div>
              </main>
              <aside id="tray" />
            </TooltipProvider>
            <VoiceClientAudio />
          </VoiceClientProvider>
        )}
      </AssistantProvider>
    );
  }

  return (
    <div>
      <h1>Welcome to your Dashboard</h1>
      {/* Add your dashboard content here */}
    </div>
  );
};

export default DashboardPage;