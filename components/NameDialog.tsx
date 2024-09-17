// components/NameDialog.tsx
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"

interface NameDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: string, firstName: string, lastInitial: string) => void
  groupId: string
}

export function NameDialog({ isOpen, onOpenChange, onSubmit, groupId }: NameDialogProps) {
  const [firstName, setFirstName] = useState<string>('')
  const [lastInitial, setLastInitial] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    console.log('NameDialog isOpen:', isOpen)
  }, [isOpen])

  const handleSubmit = async () => {
    if (!firstName || !lastInitial) {
      toast({
        title: "Error",
        description: "Please enter your first name and last initial.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        throw error
      }

      if (data.user) {
        onSubmit(data.user.id, firstName, lastInitial)
        toast({
          title: "Success",
          description: "You have successfully joined the group.",
        })
      }
    } catch (error) {
      console.error("Error joining group:", error)
      toast({
        title: "Error",
        description: "Failed to join the group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      onOpenChange(false)
    }
  }

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
            <Label htmlFor="firstName" className="text-right">
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
            <Label htmlFor="lastInitial" className="text-right">
              Last Initial
            </Label>
            <Input
              id="lastInitial"
              value={lastInitial}
              onChange={(e) => setLastInitial(e.target.value.toUpperCase())}
              className="col-span-3"
              maxLength={1}
            />
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !firstName || !lastInitial}
        >
          {isSubmitting ? 'Joining...' : 'Join Circle'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}