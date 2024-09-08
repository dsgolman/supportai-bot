"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from 'lucide-react';

interface SpeechRecognitionProps {
  onResult: (transcript: string) => void;
}

const SpeechRecognitionComponent: React.FC<SpeechRecognitionProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // Ref for SpeechRecognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Fallback for different browsers
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        // Process speech recognition results
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    } else {
      console.error('Speech Recognition not supported in this browser.');
    }

    // Cleanup on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      // Stop listening and send the result
      recognitionRef.current?.stop();
      onResult(transcript);
      setTranscript('');
    } else {
      // Start listening
      setTranscript('');
      recognitionRef.current?.start();
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
