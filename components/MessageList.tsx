// components/MessageList.tsx
import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Mic } from 'lucide-react'
import { Message } from '@/types' // Make sure to create this types file

type MessageListProps = {
  messages: Message[]
  loading: boolean
  scrollAreaRef: React.RefObject<HTMLDivElement>
  messageEndRef: React.RefObject<HTMLDivElement>
}

export default function MessageList({ messages, loading, scrollAreaRef, messageEndRef }: MessageListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const showAvatar = index === 0 || messages[index - 1].username !== message.username
          return (
            <div key={message.id} className={`flex items-start space-x-4 ${showAvatar ? 'mt-4' : 'mt-1'}`}>
              {showAvatar && (
                <Avatar className="flex-shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.username}`} alt={`${message.username}'s avatar`} />
                  <AvatarFallback>{message.username.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col ${showAvatar ? '' : 'ml-12'}`}>
                {showAvatar && (
                  <p className="text-sm font-semibold text-purple-700 flex items-center">
                    {message.username}
                    {message.is_facilitator && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Facilitator
                      </span>
                    )}
                  </p>
                )}
                {message.message && (
                  <div className="bg-white p-3 rounded-lg shadow mt-1 max-w-md">
                    <p className="text-sm">{message.message}</p>
                  </div>
                )}
                {message.audio_url && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Mic className="w-4 h-4 text-gray-500" />
                    <audio src={message.audio_url} controls className="max-w-[200px]" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={messageEndRef} />
      </div>
    </ScrollArea>
  )
}