"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from 'lucide-react';

interface SpeechRecognitionProps {
  onResult: (transcript: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const SpeechRecognitionComponent: React.FC<SpeechRecognitionProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      
      // Use the non-null assertion operator `!` to tell TypeScript this is not null anymore
      recognitionRef.current!.continuous = true;
      recognitionRef.current!.interimResults = true;
      recognitionRef.current!.lang = 'en-US';

      recognitionRef.current!.onresult = (event: SpeechRecognitionEvent): void => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognitionRef.current!.onerror = (event: Event): void => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };

      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.error('Speech recognition is not supported in this browser');
    }

    return (): void => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = (): void => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = (): void => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      onResult(transcript);
      setTranscript('');
    }
  };

  const toggleListening = (): void => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Button disabled className="flex items-center space-x-2">
        <Mic size={20} />
        <span>Speech recognition not supported</span>
      </Button>
    );
  }

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
