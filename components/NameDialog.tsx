import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { createClient } from '@/utils/supabase/client';
import { toast } from "@/components/ui/use-toast";

interface NameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: string, firstName: string, lastInitial: string) => void;
  groupId: string;
}

export function NameDialog({ isOpen, onOpenChange, onSubmit, groupId }: NameDialogProps) {
  const [firstName, setFirstName] = React.useState<string>('');
  const [lastInitial, setLastInitial] = React.useState<string>('');
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const captcha = React.useRef<HCaptcha>(null);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!firstName || !lastInitial || !captchaToken) {
      toast({
        title: "Error",
        description: "Please enter your first name, last initial, and complete the captcha.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use anonymous auth
      const { data, error } = await supabase.auth.signUp({
        email: `${Date.now()}@anonymous.com`,
        password: Math.random().toString(36).slice(-8),
      });
      
      if (error) {
        throw error;
      }

      if (data.user) {
        const { error: insertError } = await supabase
          .from('group_members')
          .insert({
            user_id: data.user.id,
            group_id: groupId,
            full_name: `${firstName} ${lastInitial}.`
          });

        if (insertError) {
          throw insertError;
        }

        onSubmit(data.user.id, firstName, lastInitial);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: "Failed to join the group. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (captcha.current) {
        captcha.current.resetCaptcha();
      }
      setCaptchaToken(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Your Name</DialogTitle>
          <DialogDescription>
            Please enter your first name and last initial to join the circle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              First Name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Last Initial
            </Label>
            <Input
              id="lastInitial"
              value={lastInitial}
              onChange={(e) => setLastInitial(e.target.value)}
              className="col-span-3"
              maxLength={1}
            />
          </div>
          <div className="flex justify-center">
            <HCaptcha
              ref={captcha}
              sitekey="your-sitekey"
              onVerify={(token) => {
                setCaptchaToken(token);
              }}
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!captchaToken}>Join Circle</Button>
      </DialogContent>
    </Dialog>
  );
}