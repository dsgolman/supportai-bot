'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { startCall, endCall } from '@/utils/callFunctions'
import config from '@/config.json';
import { Transcript } from 'ultravox-client';
import Image from 'next/image';

export default function SessionPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('');
  const [callTranscript, setCallTranscript] = useState<Transcript[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [callTranscript]);

  const handleStatusChange = useCallback((status: string) => {
    setAgentStatus(status);
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
      // Cleanup the event handlers for the call
      if (cleanupCall) {
        cleanupCall();
      }
      await endCall();
      setIsCallActive(false);
      handleStatusChange('Call ended successfully');
    } catch (error) {
      handleStatusChange(`Error ending call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-[800px] bg-white p-8 rounded-lg shadow-lg">
        <div className="text-black">
          <h1 className="font-bold text-2xl mb-6 text-center">Mindful Guide Agent</h1>
          <div className="space-y-6">
            <div className="flex justify-center gap-4">
              <button 
                type="button" 
                className="w-28 p-2.5 rounded-md cursor-pointer font-bold bg-green-500 text-white disabled:bg-gray-400 hover:bg-green-600 transition-colors" 
                id="startCall" 
                onClick={handleStartCallButtonClick}
                disabled={isCallActive}
              >
                Start Call
              </button>
              <button 
                type="button" 
                className="w-28 p-2.5 rounded-md cursor-pointer font-bold bg-red-500 text-white disabled:bg-gray-400 hover:bg-red-600 transition-colors" 
                id="endCall" 
                onClick={handleEndCallButtonClick}
                disabled={!isCallActive}
              >
                End Call
              </button>
            </div>
            
            <div>
              <div id="agentStatusLabel" className="text-center font-semibold">Call Status: {agentStatus}</div>
            </div>
            
            <div>
              <h2 className="mb-2.5 font-semibold">Call Transcript</h2>
              <div 
                ref={transcriptContainerRef}
                className="h-[300px] border border-gray-300 rounded-md p-4 overflow-y-auto bg-gray-50" 
              >
                {callTranscript && callTranscript.map((transcript, index) => (
                  <div key={index} className="mb-2">
                    <p><span className="font-bold">{transcript.speaker}</span>: {transcript.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}