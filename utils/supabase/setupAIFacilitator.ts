import { createClient } from '@/utils/supabase/server'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient()

async function setupAIFacilitator() {
  try {
    // Create AI user in auth.users
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'ai-facilitator@example.com',
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
      user_metadata: { is_ai_facilitator: true }
    })

    if (userError) throw userError

    console.log('AI Facilitator user created:', user)

    // Create corresponding profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        username: 'AI_Facilitator',
        full_name: 'AI Facilitator',
        is_facilitator: true,
        is_onboarded: true
      })
      .select()
      .single()

    if (profileError) throw profileError

    console.log('AI Facilitator profile created:', profile)

    console.log('AI Facilitator setup complete')
  } catch (error) {
    console.error('Error setting up AI Facilitator:', error)
  }
}

setupAIFacilitator()