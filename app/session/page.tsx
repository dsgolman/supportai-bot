'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { startCall, endCall } from '@/utils/callFunctions'
import config from '@/config.json';
import { Transcript } from 'ultravox-client';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, PhoneOff, MessageSquare, Activity, Brain, Heart, Volume2 } from 'lucide-react'

const coaches = [
  { name: 'Dr. Fit', specialty: 'Physical Health', icon: Activity },
  { name: 'Dr. Mind', specialty: 'Mental Health', icon: Brain },
  { name: 'Dr. Heart', specialty: 'Emotional Health', icon: Heart },
]

export default function SessionPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [coachStatus, setCoachStatus] = useState<string>('');
  const [callTranscript, setCallTranscript] = useState<Transcript[]>([]);
  const [selectedCoach, setSelectedCoach] = useState(coaches[0]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [callTranscript]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setIsAudioActive(prev => !prev);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const handleStatusChange = useCallback((status: string) => {
    setCoachStatus(status);
  }, []);

  const handleTranscriptChange = useCallback((transcripts: Transcript[]) => {
    setCallTranscript(prevTranscripts => {  
      return [...transcripts];
    });
  }, []);

  let cleanupCall: (() => void) | undefined;

  const handleStartCallButtonClick = async () => {
    try {
      handleStatusChange('Starting call...');
      cleanupCall = await startCall({
        onStatusChange: handleStatusChange,
        onTranscriptChange: handleTranscriptChange
      });
      setIsCallActive(true);
      handleStatusChange('Call started successfully');
    } catch (error) {
      handleStatusChange(`Error starting call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleEndCallButtonClick = async () => {
    try {
      handleStatusChange('Ending call...');
      if (cleanupCall) {
        cleanupCall();
      }
      await endCall();
      setIsCallActive(false);
      setShowTranscript(false);
      handleStatusChange('Call ended successfully');
    } catch (error) {
      handleStatusChange(`Error ending call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const toggleTranscript = () => {
    setShowTranscript(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffdab9] p-4">
      {!isCallActive ? (
        <Card className="w-full max-w-[800px] bg-white p-8 rounded-lg shadow-lg">
          <h1 className="font-bold text-2xl mb-6 text-center">Choose Your Health Coach</h1>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {coaches.map((coach) => (
              <div 
                key={coach.name} 
                className={`text-center cursor-pointer transition-all duration-300 ${selectedCoach.name === coach.name ? 'scale-110' : 'hover:scale-105'}`}
                onClick={() => setSelectedCoach(coach)}
              >
                <Avatar className="w-24 h-24 mb-2 bg-blue-100">
                  <AvatarFallback>
                    <coach.icon className="w-12 h-12 text-blue-500" />
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{coach.name}</p>
                <p className="text-sm text-gray-500">{coach.specialty}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button 
              onClick={handleStartCallButtonClick}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Start Call with {selectedCoach.name}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="w-full max-w-[800px] bg-white p-8 rounded-lg shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 mb-2 bg-blue-100">
              <AvatarFallback>
                <selectedCoach.icon className="w-12 h-12 text-blue-500" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{selectedCoach.name}</h2>
            <p className="text-sm text-gray-500">{selectedCoach.specialty} Coach</p>
            <p className="text-sm text-gray-500 mt-2">{coachStatus}</p>
          </div>
          
          <div className="flex justify-center items-center mb-6">
            <div className={`w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center transition-all duration-300 ${isAudioActive ? 'scale-110' : 'scale-100'}`}>
              <Volume2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {showTranscript && (
            <div 
              ref={transcriptContainerRef}
              className="h-[200px] border border-gray-200 rounded-md p-4 overflow-y-auto bg-gray-50 mb-6" 
            >
              {callTranscript.length === 0 ? (
                <p className="text-center text-gray-400">Messages will appear here.</p>
              ) : (
                callTranscript.map((transcript, index) => (
                  <div key={index} className={`mb-2 ${transcript.speaker === 'User' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block p-2 rounded-lg ${transcript.speaker === 'User' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                      <p className="font-semibold">{transcript.speaker}</p>
                      <p>{transcript.text}</p>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
          
          <div className="flex justify-center gap-4">
            <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800">
              <Mic className="mr-2 h-4 w-4" />
              Mute
            </Button>
            <Button 
              onClick={toggleTranscript}
              className={`${showTranscript ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {showTranscript ? 'Hide Chat' : 'Show Chat'}
            </Button>
            <Button 
              onClick={handleEndCallButtonClick}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}