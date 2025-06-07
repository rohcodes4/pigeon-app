
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

    const { code, user_id } = await req.json()

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing code or user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange code for Telegram user info
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!telegramBotToken) {
      return new Response(
        JSON.stringify({ error: 'Telegram bot token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // In a real implementation, you would validate the Telegram auth data
    // For now, we'll simulate a successful response
    const telegramUserData = {
      id: code, // Using code as user ID for demo
      username: `telegram_user_${code}`,
      first_name: 'Telegram',
      last_name: 'User'
    }

    // Store the connected account
    const { error } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id,
        platform: 'telegram',
        platform_user_id: telegramUserData.id.toString(),
        platform_username: telegramUserData.username,
        access_token: code, // In reality, this would be a proper token
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_data: telegramUserData 
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
