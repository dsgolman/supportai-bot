import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  convertBlobToBase64,
  ensureSingleValidAudioTrack,
  getAudioStream,
  getBrowserSupportedMimeType,
  Hume,
  MimeType,
} from 'hume';

interface AudioCaptureProps {
  onAudioInput: (audioInput: Omit<Hume.empathicVoice.AudioInput, 'type'>) => void;
  isActive: boolean;
}

export default function AudioCapture({ onAudioInput, isActive }: AudioCaptureProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  const mimeType: MimeType = React.useMemo(() => {
    const result = getBrowserSupportedMimeType();
    return result.success ? result.mimeType : MimeType.WEBM;
  }, []);

  const captureAudio = useCallback(async () => {
    try {
      console.log('Attempting to capture audio...');
      const stream = await getAudioStream();
      ensureSingleValidAudioTrack(stream);
      setAudioStream(stream);
      console.log('Audio stream obtained:', stream);

      const newRecorder = new MediaRecorder(stream, { mimeType });

      newRecorder.ondataavailable = async (event) => {
        console.log('Data available event triggered');
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      newRecorder.onstop = async () => {
        console.log('Recorder stopped, processing chunks...');
        const blob = new Blob(chunks.current, { type: mimeType });
        chunks.current = [];

        try {
          const encodedAudioData = await convertBlobToBase64(blob);
          const audioInput: Omit<Hume.empathicVoice.AudioInput, 'type'> = {
            data: encodedAudioData,
          };
          console.log('Sending audio input:', audioInput);
          onAudioInput(audioInput);
        } catch (error) {
          console.error('Error processing audio data:', error);
        }
      };

      setRecorder(newRecorder);
    } catch (error) {
      console.error('Error capturing audio:', error);
    }
  }, [mimeType, onAudioInput]);

  useEffect(() => {
    if (isActive && !recorder) {
      captureAudio();
    } else if (!isActive && recorder) {
      console.log('Stopping recorder...');
      recorder.stop();
      setRecorder(null);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }

    return () => {
      if (recorder) {
        console.log('Cleaning up recorder...');
        recorder.stop();
      }
      if (audioStream) {
        console.log('Cleaning up audio stream...');
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, recorder, audioStream, captureAudio]);

  useEffect(() => {
    if (recorder && isActive) {
      console.log('Starting recorder...');
      recorder.start(100); // Record in 1-second intervals
    } else if (recorder && !isActive) {
      console.log('Stopping recorder...');
      recorder.stop();
    }
  }, [recorder, isActive]);

  return null; // This component doesn't render anything visible
}