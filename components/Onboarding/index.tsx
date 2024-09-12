"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const steps = [
  { title: 'Welcome', description: 'Let\'s get started with Daily Dose' },
  { title: 'Personal Details', description: 'Tell us a bit about yourself' },
  { title: 'Age Range', description: 'Select your age range' },
  { title: 'Gender', description: 'Select your gender' },
  { title: 'Relationship Status', description: 'Select your relationship status' },
  { title: 'Hobbies/Interests', description: 'Tell us about your hobbies and interests' },
];

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [hobbies, setHobbies] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentStep === 1 && inputRef.current) {
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

  const handleFinishOnboarding = async () => {
    // Save the onboarding data to the server or local storage
    // For example, using Supabase:
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    const { error } = await supabase.from('profiles').update({
      is_onboarded: true,
      full_name: name,
      age_range: ageRange,
      gender,
      relationship_status: relationshipStatus,
      hobbies,
    }).eq('id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "There was an error completing your onboarding."
      });
      console.log(error);
      return;
    }

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
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Age Range</Label>
              <select
                id="ageRange"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                required
              >
                <option value="">Select your age range</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55-64">55-64</option>
                <option value="65+">65+</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Relationship Status</Label>
              <select
                id="relationshipStatus"
                value={relationshipStatus}
                onChange={(e) => setRelationshipStatus(e.target.value)}
                required
              >
                <option value="">Select your relationship status</option>
                <option value="single">Single</option>
                <option value="in-a-relationship">In a relationship</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hobbies/Interests</Label>
              <Input
                id="hobbies"
                type="text"
                placeholder="Enter your hobbies and interests"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
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
          {currentStep > 0 && (
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