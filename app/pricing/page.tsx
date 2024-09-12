'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingTierProps {
  name: string;
  price: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  highlighted?: boolean;
}

const PricingTier: React.FC<PricingTierProps> = ({ 
  name, 
  price, 
  features, 
  buttonText, 
  onClick, 
  highlighted = false 
}) => (
  <Card className={`flex flex-col ${highlighted ? 'border-amber-500 shadow-lg' : ''}`}>
    <CardHeader>
      <CardTitle className="text-2xl font-bold">{name}</CardTitle>
      <CardDescription className="text-4xl font-bold">{price}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <Button 
        onClick={onClick} 
        className={`w-full ${highlighted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
      >
        {buttonText}
      </Button>
    </CardFooter>
  </Card>
);

export default function PricingPage() {
  const router = useRouter();

  const handleSubscribe = (tier: 'basic' | 'pro' | 'enterprise') => {
    switch (tier) {
      case 'basic':
        router.push('/support-rooms');
        break;
      case 'pro':
        // Implement subscription logic for Pro tier
        console.log('Subscribing to Pro tier');
        // After successful subscription, redirect to room creation page
        // router.push('/create-room');
        break;
      case 'enterprise':
        // Redirect to a contact form or open a modal for enterprise inquiries
        console.log('Redirecting to enterprise contact form');
        // router.push('/enterprise-contact');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-12">Select the perfect option for your wellness journey</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <PricingTier
            name="Basic"
            price="Free"
            features={[
              "Access to public wellness circles",
              "Participate in scheduled sessions",
              "Basic chat support",
              "Limited features"
            ]}
            buttonText="Get Started"
            onClick={() => handleSubscribe('basic')}
          />
          <PricingTier
            name="Pro"
            price="$19.99/month"
            features={[
              "All Basic features",
              "Create and host custom rooms",
              "Unlimited access to all circles",
              "Priority support",
              "Advanced customization options"
            ]}
            buttonText="Subscribe to Pro"
            onClick={() => handleSubscribe('pro')}
            highlighted={true}
          />
          <PricingTier
            name="Enterprise"
            price="Custom"
            features={[
              "All Pro features",
              "Dedicated account manager",
              "Custom integrations",
              "Employee wellness programs",
              "Analytics and reporting",
              "Volume discounts"
            ]}
            buttonText="Contact Sales"
            onClick={() => handleSubscribe('enterprise')}
          />
        </div>
      </div>
    </div>
  );
}