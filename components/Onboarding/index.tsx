"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { PreCall } from '@/components/PreCall';

const steps = [
  { title: 'Welcome', description: 'Let\'s get started with Daily Dose' },
  { title: 'Onboarding Assistant', description: 'Speak with our AI onboarding assistant' },
  { title: 'Create Account', description: 'Set up your Daily Dose account' },
  { title: 'Personal Details', description: 'Tell us a bit about yourself' },
];

interface OnboardingProps {
  signup: (formData: FormData) => Promise<void>;
}

const Onboarding: React.FC<OnboardingProps> = ({ signup }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentStep === 3 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStep]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
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
      handleNextStep();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error creating your account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFinishOnboarding = () => {
    window.location.href = '/dashboard';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Daily Dose</h2>
            <p>Get ready to transform your daily routine with personalized content and insights.</p>
          </div>
        );
      case 1:
        return null
          // <PreCall onComplete={handleNextStep} />
        // );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
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
              <Label>Password</Label>
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
              <Label>Name</Label>
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
    if (currentStep === steps.length - 1) {
      return (
        <Button onClick={handleFinishOnboarding}>
          Finish <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    if (currentStep === 2) {
      return (
        <Button onClick={handleSignUp} disabled={!email || !password}>
          Sign Up <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    if (currentStep === 1) {
      return null; // PreCall component handles its own navigation
    }

    return (
      <Button onClick={handleNextStep}>
        Next <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    );
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-primary to-secondary">
      <Card className="w-full max-w-md">
        <CardHeader>
          {currentStepData && (
            <>
              <CardTitle>{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 0 && currentStep !== 1 && (
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