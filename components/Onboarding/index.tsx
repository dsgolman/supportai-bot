"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mic, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingProps {
  signup: (formData: FormData) => Promise<void>;
}

const Onboarding: React.FC<OnboardingProps> = ({ signup }) => {
  const [step, setStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const steps = [
    { title: 'Welcome', description: 'Let\'s get started with Daily Dose' },
    { title: 'Voice Interaction', description: 'Try our voice interface' },
    { title: 'Create Account', description: 'Set up your Daily Dose account' },
    { title: 'Personal Details', description: 'Tell us a bit about yourself' },
  ];

  useEffect(() => {
    if (step === 3 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleNextStep = () => {
    if (step < steps.length - 1) {
      setStep(prevStep => prevStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      setStep(prevStep => prevStep - 1);
    }
  };

  const handleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Assume humeEviVoiceClient is correctly initialized
      humeEviVoiceClient.stopRecording();
      const result = await humeEviVoiceClient.getTranscription();
      setTranscript(result);
    } else {
      setIsRecording(true);
      // Assume humeEviVoiceClient is correctly initialized
      humeEviVoiceClient.startRecording();
    }
  };

  const handleSignUp = async () => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      await signup(formData);
      toast({
        title: 'Account created',
        description: 'Please check your email for confirmation.',
      });
      // Redirect to the confirmation page after sign-up
      window.location.href = '/check-email';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error creating your account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFinishOnboarding = () => {
    // Handle additional actions after onboarding if needed
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Daily Dose</h2>
            <p>Get ready to transform your daily routine with personalized content and insights.</p>
          </div>
        );
      case 1:
        return (
          <div className="text-center">
            <Button
              onClick={handleRecording}
              className={`w-24 h-24 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Mic className="w-12 h-12" />
            </Button>
            <p className="mt-4">{isRecording ? 'Recording...' : 'Press to start recording'}</p>
            {transcript && <p className="mt-4 font-medium" aria-live="polite">&quot;{transcript}&quot;</p>}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                ref={inputRef}
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    if (step === steps.length - 1) {
      return (
        <Button onClick={handleFinishOnboarding}>
          Finish <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    if (step === 2) {
      return (
        <Button onClick={handleSignUp} disabled={!email || !password}>
          Sign Up <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button onClick={handleNextStep}>
        Next <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-primary to-secondary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 0 && (
            <Button onClick={handlePreviousStep} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          {renderActionButton()}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Onboarding;
