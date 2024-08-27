import React, { useCallback, useEffect, useRef, useState } from "react";
import { VoiceClientConfigOption, VoiceClientServices } from "realtime-ai";
import { useVoiceClient } from "realtime-ai-react";

import HelpTip from "@/components/ui/helptip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import DeviceSelect from "@/components/DeviceSelect";

interface ConfigureProps {
  state: string;
  startAudioOff?: boolean;
  inSession?: boolean;
  handleStartAudioOff?: () => void;
}

export const Configure: React.FC<ConfigureProps> = React.memo(
  ({
    startAudioOff,
    state,
    inSession = false,
    handleStartAudioOff
  }) => {
    const voiceClient = useVoiceClient()!;

    return (
      <>
        <section className="flex flex-col flex-wrap gap-3 lg:gap-4" id="configure-component">
          <DeviceSelect hideMeter={false} />
        </section>

        {!inSession && (
          <section className="flex flex-col gap-4 border-y border-primary-hairline py-4">
            <div className="flex flex-row justify-between items-center">
              <Label className="flex flex-row gap-1 items-center">
                Join with mic muted{" "}
                <HelpTip text="Start with microphone muted (click to unmute)" />
              </Label>
              <Switch
                checked={startAudioOff}
                onCheckedChange={handleStartAudioOff}
              />
            </div>
          </section>
        )}
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.startAudioOff === nextProps.startAudioOff &&
    prevProps.state === nextProps.state
);

Configure.displayName = "Configure";