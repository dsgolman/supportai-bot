import React, { useCallback, useState, useRef, useEffect } from "react";
import { VoiceEvent } from "realtime-ai";
import { useVoiceClientEvent } from "realtime-ai-react";
import { cn } from "@/lib/utils";

interface TranscriptOverlayProps {
  className?: string;
}

const TranscriptOverlay: React.FC<TranscriptOverlayProps> = ({ className = "" }) => {
  const [transcript, setTranscript] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useVoiceClientEvent(
    VoiceEvent.BotTranscript,
    useCallback((text: string) => {
      setTranscript(prev => prev + (prev ? " " : "") + text.trim());
      setIsSpeaking(true);
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.BotStartedSpeaking,
    useCallback(() => {
      setIsSpeaking(true);
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    useCallback(() => {
      setIsSpeaking(false);
    }, [])
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  const renderTranscript = () => {
    const words = transcript.split(' ');
    return words.map((word, index) => (
      <span 
        key={index} 
        className={cn(
          "inline-block mr-1",
          index >= words.length - 5 && isSpeaking
            ? "text-primary font-semibold animate-pulse"
            : "text-gray-700"
        )}
      >
        {word}
      </span>
    ));
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "overflow-y-auto max-h-60 p-4 bg-white/80 rounded-lg shadow-md",
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {transcript ? renderTranscript() : (
        <p className="text-gray-500 italic">No transcript available</p>
      )}
    </div>
  );
};

export default TranscriptOverlay;