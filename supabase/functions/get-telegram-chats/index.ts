
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the user's Telegram access token
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('access_token, platform_user_id')
      .eq('user_id', user_id)
      .eq('platform', 'telegram')
      .single()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Telegram account not connected' }),
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

    // Get user's chats from Telegram Bot API
    // Note: This requires the bot to be added to the chats
    const chatsResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
      method: 'GET',
    })

    if (!chatsResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Telegram chats' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const chatsData = await chatsResponse.json()
    
    // Extract unique chats from updates
    const chats = new Map()
    
    if (chatsData.result) {
      chatsData.result.forEach((update: any) => {
        if (update.message?.chat) {
          const chat = update.message.chat
          chats.set(chat.id, {
            id: chat.id.toString(),
            name: chat.title || `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || 'Private Chat',
            type: chat.type,
            member_count: chat.all_members_are_administrators ? null : 0
          })
        }
      })
    }

    // Store chats in database
    const chatArray = Array.from(chats.values())
    for (const chat of chatArray) {
      await supabaseClient
        .from('synced_groups')
        .upsert({
          user_id,
          platform: 'telegram',
          group_id: chat.id,
          group_name: chat.name,
          group_avatar: null,
          member_count: chat.member_count,
          is_synced: false,
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chats: chatArray 
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
