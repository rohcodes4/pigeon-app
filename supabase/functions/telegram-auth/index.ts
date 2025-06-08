
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { telegramData, user_id } = await req.json()

    if (!telegramData || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing Telegram data or user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify Telegram auth data
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!telegramBotToken) {
      console.log('Telegram bot token not configured, using demo mode')
      // In demo mode, just store the connection
    } else {
      // Verify the auth data hash in production
      const { hash, ...authData } = telegramData
      const dataCheckString = Object.keys(authData)
        .sort()
        .map(key => `${key}=${authData[key]}`)
        .join('\n')

      const crypto = await import('node:crypto')
      const secretKey = crypto.createHash('sha256').update(telegramBotToken).digest()
      const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

      if (hmac !== hash) {
        return new Response(
          JSON.stringify({ error: 'Invalid Telegram authentication data' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if auth data is not older than 86400 seconds (1 day)
      const authDate = parseInt(telegramData.auth_date)
      if (Date.now() / 1000 - authDate > 86400) {
        return new Response(
          JSON.stringify({ error: 'Telegram authentication data is too old' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Store the connected account
    const { error } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id,
        platform: 'telegram',
        platform_user_id: telegramData.id.toString(),
        platform_username: telegramData.username || `${telegramData.first_name} ${telegramData.last_name || ''}`.trim(),
        access_token: telegramData.hash || 'demo_token',
      })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save connection' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store some demo groups for Telegram
    const demoGroups = [
      { id: 'tg_group_1', name: 'General Chat', members: 25 },
      { id: 'tg_group_2', name: 'Development Team', members: 8 },
      { id: 'tg_group_3', name: 'Project Updates', members: 15 }
    ];

    for (const group of demoGroups) {
      await supabaseClient
        .from('synced_groups')
        .upsert({
          user_id,
          platform: 'telegram',
          group_id: group.id,
          group_name: group.name,
          group_avatar: null,
          member_count: group.members,
          is_synced: false,
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_data: {
          id: telegramData.id,
          username: telegramData.username,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
