// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"
import { z } from 'zod'
import WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'

// Input validation schemas
const initSchema = z.object({
  groupId: z.string().uuid(),
  resume_chat_group_id: z.string().uuid().nullable().optional(),
})

// WebSocket connection pool
const wsConnections: { [groupId: string]: { ws: WebSocket, messageListener: any, heartbeatInterval: NodeJS.Timeout | null, chatGroupId: string } } = {}

async function initializeChat(groupId: string, configId: string, aiFacilitatorId: string, resumeChatGroupId: string | null, isAiFacilitator: boolean) {
  const supabase = createClient()

  try {
    // Skip initialization for AI facilitator
    if (isAiFacilitator) {
      console.log(`Skipping chat initialization for AI facilitator in group ${groupId}`)
      return null
    }

    // Check if a connection already exists for this group
    if (wsConnections[groupId] && wsConnections[groupId].ws.readyState === WebSocket.OPEN) {
      console.log(`WebSocket connection already exists for group ${groupId}`)
      return wsConnections[groupId].chatGroupId
    }

    const { data: existingConnection } = await supabase
      .from('chat_connections')
      .select('*')
      .eq('group_id', groupId)
      .single()

    if (existingConnection?.status === 'connected') {
      console.log(`Existing connection found for group ${groupId}`)
      return existingConnection.chat_group_id
    }

    const wsUrl = `wss://api.hume.ai/v0/evi/chat?apiKey=${process.env.HUME_API_KEY}&config_id=${configId}${resumeChatGroupId ? `&resumed_chat_group_id=${resumeChatGroupId}` : ''}`
    const newChatGroupId = resumeChatGroupId || uuidv4()

    const ws = new WebSocket(wsUrl)

    ws.on('open', () => {
      console.log(`WebSocket connection opened for group ${groupId}`)
      updateConnectionStatus(groupId, 'connected')
      startHeartbeat(groupId)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for group ${groupId}:`, error)
      updateConnectionStatus(groupId, 'error')
    })

    ws.on('close', () => {
      console.log(`WebSocket closed for group ${groupId}`)
      stopHeartbeat(groupId)
      delete wsConnections[groupId]
      updateConnectionStatus(groupId, 'disconnected')
      // Attempt to reconnect
      setTimeout(() => reconnectWebSocket(groupId), 5000)
    })

    ws.on('message', (data) => handleAIResponse(JSON.parse(data.toString()), groupId, aiFacilitatorId))

    const messageListener = setupMessageListener(groupId)

    wsConnections[groupId] = { 
      ws, 
      messageListener,
      heartbeatInterval: null,
      chatGroupId: newChatGroupId
    }

    await supabase
      .from('chat_connections')
      .upsert({
        group_id: groupId,
        status: 'connecting',
        ai_facilitator_id: aiFacilitatorId,
        chat_group_id: newChatGroupId,
        reconnect_attempts: 0,
      }, {
        onConflict: 'group_id',
      })

    return newChatGroupId
  } catch (error) {
    console.error(`Error initializing chat for group ${groupId}:`, error)
    await updateConnectionStatus(groupId, 'error')
    throw error
  }
}

async function updateConnectionStatus(groupId: string, status: string) {
  const supabase = createClient()
  await supabase
    .from('chat_connections')
    .update({ status })
    .eq('group_id', groupId)
}

function startHeartbeat(groupId: string) {
  if (wsConnections[groupId]) {
    wsConnections[groupId].heartbeatInterval = setInterval(() => {
      if (wsConnections[groupId] && wsConnections[groupId].ws && wsConnections[groupId].ws.readyState === WebSocket.OPEN) {
        try {
          wsConnections[groupId].ws.ping()
        } catch (error) {
          console.error(`Error sending heartbeat for group ${groupId}:`, error)
          stopHeartbeat(groupId)
        }
      } else {
        console.log(`WebSocket not open for group ${groupId}, stopping heartbeat`)
        stopHeartbeat(groupId)
      }
    }, 30000) // Send a ping every 30 seconds
  }
}

function stopHeartbeat(groupId: string) {
  if (wsConnections[groupId] && wsConnections[groupId].heartbeatInterval) {
    clearInterval(wsConnections[groupId].heartbeatInterval)
    wsConnections[groupId].heartbeatInterval = null
  }
}

async function reconnectWebSocket(groupId: string) {
  const supabase = createClient()
  const { data: connectionData } = await supabase
    .from('chat_connections')
    .select('*')
    .eq('group_id', groupId)
    .single()

  if (connectionData) {
    const { config_id, ai_facilitator_id, chat_group_id, reconnect_attempts } = connectionData
    if (reconnect_attempts < 5) {
      await supabase
        .from('chat_connections')
        .update({ reconnect_attempts: reconnect_attempts + 1 })
        .eq('group_id', groupId)

      await initializeChat(groupId, config_id, ai_facilitator_id, chat_group_id, false)
    } else {
      console.error(`Max reconnection attempts reached for group ${groupId}`)
      await updateConnectionStatus(groupId, 'disconnected')
    }
  }
}

function setupMessageListener(groupId: string) {
  const supabase = createClient()
  return supabase
    .channel(`messages:${groupId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
      async (payload) => {
        const message = payload.new
        if (message.type === 'text' && wsConnections[groupId] && wsConnections[groupId].ws) {
          wsConnections[groupId].ws.send(JSON.stringify({
            type: 'text',
            content: message.message,
            user_id: message.user_id
          }))
        }
      }
    )
    .subscribe()
}

async function handleAIResponse(response: any, groupId: string, aiFacilitatorId: string) {
  const supabase = createClient()
  if (response.type === 'text') {
    await supabase.from('messages').insert({
      group_id: groupId,
      user_id: aiFacilitatorId,
      message: response.content,
      type: 'text'
    })
  } else if (response.type === 'audio') {
    // Handle audio response
    console.log('Received audio response from AI')
    // Implement audio handling logic here
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const { groupId, resume_chat_group_id } = initSchema.parse(await request.json())

    // Check if the user is an AI facilitator
    const { data: groupMember, error: groupMemberError } = await supabase
      .from('group_members')
      .select('is_facilitator, ai_facilitator_id')
      .eq('group_id', groupId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (groupMemberError) {
      console.error('Error fetching group member:', groupMemberError)
      return NextResponse.json({ message: 'Error fetching group member' }, { status: 500 })
    }

    const isAiFacilitator = groupMember?.is_facilitator && groupMember?.ai_facilitator_id !== null

    // Check if a connection already exists
    const existingConnection = wsConnections[groupId]
    if (existingConnection && existingConnection.ws.readyState === WebSocket.OPEN) {
      console.log(`Existing WebSocket connection found for group ${groupId}`)
      return NextResponse.json({ message: 'Chat already initialized', chatGroupId: existingConnection.chatGroupId }, { status: 200 })
    }

    if (!process.env.HUME_API_KEY) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }

    const { data: groupData } = await supabase
      .from('groups')
      .select('config_id')
      .eq('id', groupId)
      .single()

    if (!groupData?.config_id) {
      return NextResponse.json({ message: 'Group configuration not found' }, { status: 404 })
    }

    const { data: aiFacilitator } = await supabase
      .from('ai_facilitators')
      .upsert({ config_id: groupData.config_id, name: `AI Facilitator ${groupData.config_id}` }, { onConflict: 'config_id' })
      .select()
      .single()

    const { data: addedFacilitator } = await supabase
      .from('group_members')
      .upsert({
        group_id: groupId,
        ai_facilitator_id: aiFacilitator.id,
        user_id: null,
        role: "facilitator",
        is_facilitator: true
      }, { onConflict: 'group_id,ai_facilitator_id' })
      .select()
      .single()

    const chatGroupId = await initializeChat(groupId, groupData.config_id, aiFacilitator.id, resume_chat_group_id, isAiFacilitator)

    // Initialize or reset turn state
    await supabase
      .from('group_turns')
      .upsert({
        group_id: groupId,
        current_user_id: null,
        queue: [],
        turn_start_time: null
      }, { onConflict: 'group_id' })

    return NextResponse.json({ 
      message: isAiFacilitator ? 'AI Facilitator added to group' : 'Chat initialized successfully', 
      aiFacilitator: addedFacilitator, 
      chatGroupId 
    }, { status: 200 })
  } catch (error) {
    console.error('Error in POST request:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const groupId = new URL(request.url).searchParams.get('groupId')
  if (!groupId) {
    return NextResponse.json({ message: 'Group ID is required' }, { status: 400 })
  }

  try {
    const supabase = createClient()
    const { data: connectionData, error } = await supabase
      .from('chat_connections')
      .select('status, chat_group_id')
      .eq('group_id', groupId)
      .single()

    if (error) {
      return NextResponse.json({ message: 'Chat not initialized for this group' }, { status: 404 })
    }

    return NextResponse.json(connectionData, { status: 200 })
  } catch (error) {
    console.error('Error in GET request:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const groupId = new URL(request.url).searchParams.get('groupId')
  if (!groupId) {
    return NextResponse.json({ message: 'Group ID is required' }, { status: 400 })
  }

  try {
    if (wsConnections[groupId]) {
      wsConnections[groupId].ws.close()
      wsConnections[groupId].messageListener.unsubscribe()
      stopHeartbeat(groupId)
      delete wsConnections[groupId]
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('chat_connections')
      .update({ status: 'disconnected' })
      .eq('group_id', groupId)
      .select()

    // Reset turn state when closing the chat
    await supabase
      .from('group_turns')
      .update({
        current_user_id: null,
        queue: [],
        turn_start_time: null
      })
      .eq('group_id', groupId)

    if (data && data.length > 0) {
      return NextResponse.json({ message: 'Chat connection closed and removed' }, { status: 200 })
    } else {
      return NextResponse.json({ message: 'No active chat found for this group' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error in DELETE request:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}