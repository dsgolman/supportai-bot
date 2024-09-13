"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import Chat from "./Chat";

interface Coach {
  id: string;
  name: string;
  config_id: string;
  description: string;
  specialty: string;
  avatar_url: string;
}

const promptSuggestions = [
  { label: "Supportive Friend", value: "supportive_friend", text: "You are a supportive friend providing empathy and encouragement. Listen attentively, offer kind words, and suggest positive actions when appropriate." },
  { label: "Career Coach", value: "career_coach", text: "You are a career coach helping users navigate their professional lives. Offer guidance on job searches, resume writing, interview preparation, and career development." },
  { label: "Meditation Guide", value: "meditation_guide", text: "You are a meditation guide helping users relax and find inner peace. Lead short guided meditations, breathing exercises, and mindfulness practices." },
  { label: "Custom", value: "custom", text: "Fill in the prompt text here." }
];

export default function SerenitySession() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isCreatingCustomSession, setIsCreatingCustomSession] = useState(false);
  const [customSessionStep, setCustomSessionStep] = useState(1);
  const [sessionName, setSessionName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptId, setPromptId] = useState('');
  const [configId, setConfigId] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchCoaches = async () => {
      const { data, error } = await supabase.from('coaches').select('*');
      if (error) {
        console.error('Error fetching coaches:', error);
        toast({
          title: "Error",
          description: "Failed to fetch coaches. Please try again.",
          variant: "destructive",
        });
      } else {
        setCoaches(data);
      }
    };

    fetchCoaches();
  }, [supabase]);

  const handleCoachSelect = (selectedCoach: Coach) => {
    setCoach(selectedCoach);
    setConfigId(selectedCoach.config_id);
    setIsCallStarted(true);
  };

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
      const response = await fetch('/api/create-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionName,
          text: `<role>${promptText}</role>`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }

      const data = await response.json();
      setPromptId(data.id);
      setCustomSessionStep(2);
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
      const response = await fetch('/api/create-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${sessionName} Config`,
          promptId: promptId,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create config');
      }

      const data = await response.json();
      setConfigId(data.id);
      setCustomSessionStep(3);
    } catch (error) {
      console.error('Error creating config:', error);
      toast({
        title: "Error",
        description: "Failed to create config. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startCustomSession = () => {
    setIsCallStarted(true);
  };

  if (isCallStarted) {
    return (
      <Chat
        configId={configId}
        coach={coach}
        sessionName={sessionName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-800">Serenity Sessions</h1>
        {!isCreatingCustomSession ? (
          <>
            <p className="text-xl text-center text-purple-600 mb-12">Select your guide or create your own session</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((c) => (
                <motion.div
                  key={c.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm"
                    onClick={() => handleCoachSelect(c)}
                  >
                    <CardHeader className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={c.avatar_url} alt={c.name} />
                        <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-2xl text-purple-700">{c.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2 bg-purple-200 text-purple-700">{c.specialty}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 text-center">{c.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button 
                onClick={() => setIsCreatingCustomSession(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Create Your Own Session
              </Button>
            </div>
          </>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              {customSessionStep === 1 && (
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
                  <Button 
                    onClick={createPrompt} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!sessionName || !promptText}
                  >
                    Create Prompt
                  </Button>
                </motion.div>
              )}
              {customSessionStep === 2 && (
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
              {customSessionStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <CardTitle className="text-2xl mb-4 text-purple-700">Step 3: Start Your Session</CardTitle>
                  <p className="mb-4 text-gray-600">Your session is ready! Click below to begin your personalized Serenity Session.</p>
                  <Button onClick={startCustomSession} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Start Session
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}