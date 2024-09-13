'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { HumeClient, Hume } from "hume";

const promptSuggestions = [
  { label: "Supportive Friend", value: "supportive_friend", text: "You are a supportive friend providing empathy and encouragement. Listen attentively, offer kind words, and suggest positive actions when appropriate." },
  { label: "Career Coach", value: "career_coach", text: "You are a career coach helping users navigate their professional lives. Offer guidance on job searches, resume writing, interview preparation, and career development." },
  { label: "Meditation Guide", value: "meditation_guide", text: "You are a meditation guide helping users relax and find inner peace. Lead short guided meditations, breathing exercises, and mindfulness practices." },
  { label: "Custom", value: "custom", text: "Fill in the prompt text here." }
];

export default function CreateSession() {
  const [step, setStep] = useState(1);
  const [sessionName, setSessionName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptId, setPromptId] = useState('');
  const [configId, setConfigId] = useState('');
  const router = useRouter();

  const handlePromptSuggestion = (value: string) => {
    const selectedPrompt = promptSuggestions.find(suggestion => suggestion.value === value);
    if (selectedPrompt) {
      if (selectedPrompt.value === 'custom') {
        setPromptText('');
      } else {
        setPromptText(selectedPrompt.text);
      }
    }
  };

  const createPrompt = async () => {
    try {
      const client = new HumeClient({ apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY });
      const response = await client.empathicVoice.prompts.createPrompt({
        name: sessionName,
        text: `<role>${promptText}</role>`
      });
      setPromptId(response.id);
      setStep(2);
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to create prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createConfig = async () => {
    try {
      const client = new HumeClient({ apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY });
      const response = await client.empathicVoice.configs.createConfig({
        name: `${sessionName} Config`,
        prompt: {
          id: promptId,
          version: 0
        },
        eviVersion: "2",
        voice: {
          provider: "HUME_AI",
          name: "SAMPLE VOICE"
        },
        languageModel: {
          modelProvider: Hume.PostedLanguageModelModelProvider.Anthropic,
          modelResource: "claude-3-5-sonnet-20240620",
          temperature: 1
        },
        eventMessages: {
          onNewChat: {
            enabled: false,
            text: ""
          },
          onInactivityTimeout: {
            enabled: false,
            text: ""
          },
          onMaxDurationTimeout: {
            enabled: false,
            text: ""
          }
        }
      });
      setConfigId(response.id);
      setStep(3);
    } catch (error) {
      console.error('Error creating config:', error);
      toast({
        title: "Error",
        description: "Failed to create config. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startSession = () => {
    router.push(`/session/${configId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-800">Create Your Own Session</h1>
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle className="text-2xl mb-4 text-purple-700">Step 1: Define Your Session</CardTitle>
                <Input
                  placeholder="Name Your Coach"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mb-4"
                />
                <Select onValueChange={handlePromptSuggestion}>
                  <SelectTrigger className="mb-4">
                    <SelectValue placeholder="Select a prompt template" />
                  </SelectTrigger>
                  <SelectContent>
                    {promptSuggestions.map((suggestion) => (
                      <SelectItem key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Describe the role and purpose of your AI assistant"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="mb-4"
                  rows={6}
                />
                <Button onClick={createPrompt} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Create Prompt
                </Button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle className="text-2xl mb-4 text-purple-700">Step 2: Configure Your Session</CardTitle>
                <p className="mb-4 text-gray-600">Your prompt has been created. Click below to set up the configuration for your session.</p>
                <Button onClick={createConfig} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Create Configuration
                </Button>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle className="text-2xl mb-4 text-purple-700">Step 3: Start Your Session</CardTitle>
                <p className="mb-4 text-gray-600">Your session is ready! Click below to begin your personalized Serenity Session.</p>
                <Button onClick={startSession} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Start Session
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}