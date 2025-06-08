
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash, createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { telegramData, user_id } = await req.json()

    if (!telegramData || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing telegram data or user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify Telegram data authenticity
    const { hash, ...dataToCheck } = telegramData
    const secretKey = createHash('sha256').update(botToken).digest()
    const dataCheckString = Object.keys(dataToCheck)
      .sort()
      .map(key => `${key}=${dataToCheck[key]}`)
      .join('\n')
    
    const hmac = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    
    if (hmac !== hash) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store the connection in database
    const { error: insertError } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id: user_id,
        platform: 'telegram',
        platform_user_id: telegramData.id.toString(),
        platform_username: telegramData.username || `${telegramData.first_name} ${telegramData.last_name || ''}`.trim(),
        connected_at: new Date().toISOString(),
        metadata: {
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          username: telegramData.username,
          photo_url: telegramData.photo_url,
          auth_date: telegramData.auth_date,
        },
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save connection' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Automatically fetch available chats/channels
    // Note: For Telegram, we need the bot to be added to groups/channels to access them
    // We'll create some sample data and let the user manually add their important chats
    const sampleChats = [
      {
        id: 'personal_' + telegramData.id,
        name: 'Personal Messages',
        type: 'private'
      }
    ]

    for (const chat of sampleChats) {
      await supabaseClient
        .from('synced_groups')
        .upsert({
          user_id: user_id,
          platform: 'telegram',
          group_id: chat.id,
          group_name: chat.name,
          group_avatar: null,
          member_count: chat.type === 'private' ? 2 : null,
          is_synced: false,
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: telegramData,
        chats: sampleChats 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Telegram auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
