import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Phone, Anchor, Activity } from 'lucide-react';

export default function CrisisSupport() {
  return (
    // <ScrollArea className="h-[600px] w-full max-w-md mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Crisis Support</CardTitle>
          <CardDescription>We're here to help you through this difficult time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Hello, I'm here to support you through this crisis. Please let me know what you're experiencing, and I'll do my best to help.</p>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="immediate-steps">
              <AccordionTrigger>Immediate Steps</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Focus on your breathing</li>
                  <li>Try a grounding technique</li>
                  <li>Reach out to a trusted friend or family member</li>
                  <li>Contact emergency services if in immediate danger</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="breathing-exercise">
              <AccordionTrigger>Breathing Exercise</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center space-x-2">
                  <Heart className="text-primary" />  
                  <p>Inhale deeply through your nose, hold for a few seconds, and exhale slowly through your mouth. This can help calm your body and mind.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="grounding-technique">
              <AccordionTrigger>Grounding Technique</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center space-x-2">
                  <Anchor className="text-primary" />
                  <p>Identify five things you can see, four you can touch, three you can hear, two you can smell, and one you can taste. This can help you feel more present and centered.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="coping-strategies">
              <AccordionTrigger>Coping Strategies</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Use positive affirmations</li>
                  <li>Engage in distracting activities you enjoy</li>
                  <li>Practice mindfulness or meditation</li>
                  <li>Write in a journal</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-6 space-y-4">
            <Button className="w-full flex items-center justify-center space-x-2">
              <Phone size={20} />
              <span>Contact Crisis Hotline</span>
            </Button>
            <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
              <Activity size={20} />
              <span>Find Mental Health Services</span>
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Remember, you're not alone in this. I'm here to support you, and there are resources available to help you through this crisis.</p>
            <p className="mt-2 text-sm font-semibold text-primary flex items-center justify-center">
              <Heart size={16} className="mr-1" />
              You have the strength to get through this.
            </p>
          </div>
        </CardContent>
      </Card>
    // </ScrollArea>
  );
}