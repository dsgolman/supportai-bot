"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from 'lucide-react';

interface SpeechRecognitionProps {
  onResult: (transcript: string) => void;
}

// Declare global window properties for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognitionComponent: React.FC<SpeechRecognitionProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  let recognition: any = null;

  useEffect(() => {
    // Fallback for different browsers
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (recognition) {
      recognition = new recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
      };
    }

    return () => {
      recognition?.abort();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      onResult(transcript);
      setTranscript('');
    } else {
      setTranscript('');
      recognition?.start();
    }
    setIsListening(!isListening);
  };

  return (
    <Button 
      onClick={toggleListening}
      variant={isListening ? "destructive" : "default"}
      className="flex items-center space-x-2"
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      <span>{isListening ? "Stop Speaking" : "Speak"}</span>
    </Button>
  );
};

export default SpeechRecognitionComponent;
