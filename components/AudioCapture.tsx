import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useAgoraAudio } from '@/hooks/useAgoraAudio';
import { useWebSocketAudio } from '@/hooks/useWebSocketAudio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AudioCaptureProps {
  groupId: string;
  userId: string;
  isOnStage: boolean;
  isTurnActive: boolean;
  onEndTurn: () => void;
}

const AudioCapture: React.FC<AudioCaptureProps> = ({ groupId, userId, isOnStage, isTurnActive, onEndTurn }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const { toast } = useToast();

  const {
    joinChannel,
    leaveChannel,
    toggleAudio,
    isAudioEnabled,
    remoteUsers,
    error: agoraError,
    isJoined,
  } = useAgoraAudio(groupId, userId, isOnStage);

  const {
    initializeChat,
    sendUserInput,
    closeChat,
    chatStatus,
    chatGroupId,
    error: websocketError,
    aiAudioStream,
    isChatStarted,
    startChat,
    assistantMessage,
    audioOutput
  } = useWebSocketAudio(groupId, userId);

  useEffect(() => {
    if (agoraError) setError(agoraError);
    else if (websocketError) setError(websocketError);
    else setError(null);
  }, [agoraError, websocketError]);

  const startAudioCapture = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!streamRef.current) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error('[startAudioCapture] Error accessing microphone:', err);
        throw new Error('Failed to access microphone');
      }
    }

    mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.start();
  }, []);

  const stopAudioCapture = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const float32Array = new Float32Array(arrayBuffer);
        await sendUserInput(float32Array);
        audioChunksRef.current = [];
      };
    }
  }, [sendUserInput]);

  useEffect(() => {
    if (isTurnActive && isAudioEnabled && isOnStage) {
      startAudioCapture();
    } else if (!isTurnActive && mediaRecorderRef.current) {
      stopAudioCapture();
    }
  }, [isTurnActive, isAudioEnabled, isOnStage, startAudioCapture, stopAudioCapture]);

  const handleJoinChat = useCallback(async () => {
    try {
      await joinChannel();
      await startChat();
      toast({
        title: "Joined Chat",
        description: "You have successfully joined the chat.",
      });
    } catch (err) {
      console.error('Failed to join chat:', err);
      toast({
        title: "Error",
        description: "Failed to join chat. Please try again.",
        variant: "destructive",
      });
    }
  }, [joinChannel, startChat, toast]);

  const handleLeaveChat = useCallback(async () => {
    try {
      await leaveChannel();
      await closeChat();
      toast({
        title: "Left Chat",
        description: "You have left the chat.",
      });
    } catch (err) {
      console.error('Failed to leave chat:', err);
      toast({
        title: "Error",
        description: "Failed to leave chat. Please try again.",
        variant: "destructive",
      });
    }
  }, [leaveChannel, closeChat, toast]);

  const handleEndTurn = useCallback(async () => {
    await stopAudioCapture();
    onEndTurn();
  }, [stopAudioCapture, onEndTurn]);

  const handleRaiseHand = useCallback(() => {
    setIsHandRaised(prev => !prev);
    // TODO: Implement logic to notify other participants about the hand raise
    toast({
      title: isHandRaised ? "Hand Lowered" : "Hand Raised",
      description: isHandRaised ? "You have lowered your hand." : "You have raised your hand.",
    });
  }, [isHandRaised, toast]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioOutput) {
      const audio = new Audio(URL.createObjectURL(audioOutput));
      audio.play().catch(error => {
        console.error('[playAIAudio] Error playing audio:', error);
        toast({
          title: "Error",
          description: "Failed to play AI audio",
          variant: "destructive",
        });
      });
    }
  }, [audioOutput, toast]);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex space-x-2">
        {!isJoined ? (
          <Button onClick={() => void handleJoinChat()}>Join Chat</Button>
        ) : (
          <>
            <Button onClick={() => void handleLeaveChat()}>Leave Chat</Button>
            <Button onClick={toggleAudio}>
              {isAudioEnabled ? 'Mute' : 'Unmute'}
            </Button>
            {isTurnActive && (
              <Button onClick={handleEndTurn}>End Turn</Button>
            )}
            <Button onClick={handleRaiseHand}>
              {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </Button>
          </>
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold">Remote Users:</h3>
        <ul>
          {remoteUsers.map(user => (
            <li key={user.uid}>{user.uid}</li>
          ))}
        </ul>
      </div>
      <div>
        <p>Chat Status: {chatStatus}</p>
        <p>Chat Group ID: {chatGroupId}</p>
        <p>Turn Status: {isTurnActive ? 'Active' : 'Inactive'}</p>
        <p>Hand Status: {isHandRaised ? 'Raised' : 'Lowered'}</p>
      </div>
      {assistantMessage && (
        <div>
          <h3 className="text-lg font-semibold">Assistant Message:</h3>
          <p>{assistantMessage}</p>
        </div>
      )}
    </div>
  );
};

export default AudioCapture;