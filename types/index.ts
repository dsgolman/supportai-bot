// types/index.ts
export type Message = {
    id: number
    user_id: string | null
    username: string
    message: string
    audio_url?: string
    created_at: string
    is_facilitator: boolean
  }
  
  export type Participant = {
    id: string
    username: string
    is_facilitator: boolean
    is_speaking: boolean
  }
  
  export type TurnState = {
    current_user_id: string | null
    queue: string[]
    turn_start_time: string | null
  }
  
  export type ChatMetadata = {
    chat_group_id: string
  }
  
  export type User = {
    id: string
    username: string
  }