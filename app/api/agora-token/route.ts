import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId } = await request.json()

    if (!groupId || !userId) {
      console.error('Missing groupId or userId')
      return NextResponse.json({ error: 'Missing groupId or userId' }, { status: 400 })
    }

    console.log('Fetching Agora credentials for group:', groupId)

    // Fetch Agora credentials for the group
    const { data: credentials, error } = await supabase
      .from('agora_credentials')
      .select('app_id, app_certificate')
      .eq('group_id', groupId)
      .single()

    if (error) {
      console.error('Error fetching Agora credentials:', error)
      return NextResponse.json({ error: 'Failed to fetch Agora credentials' }, { status: 500 })
    }

    if (!credentials) {
      console.error('No Agora credentials found for group:', groupId)
      return NextResponse.json({ error: 'Agora credentials not found' }, { status: 404 })
    }

    const { app_id, app_certificate } = credentials

    // Generate a channel name based on the groupId
    const channelName = `group_${groupId}`

    // Set token expiration time (e.g., 24 hours from now)
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 24 * 3600

    // Generate a numeric UID based on the userId
    const numericUid = Math.abs(hashCode(userId)) % 1000000

    console.log('Generating Agora token for user:', numericUid)

    // Generate the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      app_id,
      app_certificate,
      channelName,
      numericUid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds
    )

    console.log('Agora token generated successfully')

    // Return the token, app_id, channel_name, and numericUid
    return NextResponse.json({ token, app_id, channel_name: channelName, uid: numericUid })
  } catch (error) {
    console.error('Unhandled error in Agora token generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate a hash code from a string
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}