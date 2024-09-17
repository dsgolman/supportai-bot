import React, { useState, useCallback } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Mic } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"

interface MessageSenderProps {
  groupId: string
  userId: string
  username: string
  onMessageSent: () => void
  isUserTurn: boolean
  isFacilitator: boolean
}

export default function MessageSender({
  groupId,
  userId,
  username,
  onMessageSent,
  isUserTurn,
  isFacilitator
}: MessageSenderProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const canSendMessage = isUserTurn || isFacilitator

  const sendMessage = useCallback(async () => {
    if (!message.trim() && !audioBlob) return

    try {
      let audioUrl = null
      if (audioBlob) {
        const { data, error } = await supabase.storage
          .from('audio-messages')
          .upload(`${groupId}/${Date.now()}.webm`, audioBlob)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('audio-messages')
          .getPublicUrl(data.path)

        audioUrl = publicUrl
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: userId,
          username,
          message: message.trim(),
          audio_url: audioUrl,
          type: audioUrl ? 'audio' : 'text'
        })

      if (error) throw error

      setMessage('')
      setAudioBlob(null)
      onMessageSent()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }, [message, audioBlob, groupId, userId, username, supabase, onMessageSent, toast])

  const startRecording = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream)
        const audioChunks: BlobPart[] = []

        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data)
        })

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          setAudioBlob(audioBlob)
          setIsRecording(false)
        })

        mediaRecorder.start()
        setIsRecording(true)

        setTimeout(() => mediaRecorder.stop(), 10000) // Stop after 10 seconds
      })
      .catch(error => {
        console.error('Error accessing microphone:', error)
        toast({
          title: "Error",
          description: "Failed to access microphone. Please check your permissions.",
          variant: "destructive",
        })
      })
  }, [toast])

  return (
    <div className="flex flex-col space-y-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={canSendMessage ? "Type your message..." : "Wait for your turn to speak"}
        disabled={!canSendMessage}
        className="resize-none"
        aria-label="Message input"
      />
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button
            onClick={sendMessage}
            disabled={(!message.trim() && !audioBlob) || !canSendMessage}
            aria-label="Send message"
          >
            <Send className="mr-2 h-4 w-4" /> Send
          </Button>
          <Button
            onClick={startRecording}
            disabled={isRecording || !canSendMessage}
            aria-label={isRecording ? "Recording in progress" : "Start recording"}
          >
            <Mic className="mr-2 h-4 w-4" /> {isRecording ? 'Recording...' : 'Record'}
          </Button>
        </div>
      </div>
    </div>
  )
}