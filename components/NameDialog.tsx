// components/NameDialog.tsx
import React, { useState } from 'react'
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

interface NameDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (firstName: string, lastInitial: string) => void
  groupId: string
}

export function NameDialog({ isOpen, onOpenChange, onSubmit, groupId }: NameDialogProps) {
  const [firstName, setFirstName] = useState<string>('')
  const [lastInitial, setLastInitial] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!firstName || !lastInitial) {
      return
    }

    setIsSubmitting(true)
    await onSubmit(firstName, lastInitial)
    setIsSubmitting(false)
    onOpenChange(false)
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