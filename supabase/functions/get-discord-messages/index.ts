
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function refreshDiscordToken(refreshToken: string) {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('DISCORD_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('DISCORD_CLIENT_SECRET') ?? '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Discord token')
  }

  return await response.json()
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

    const { user_id, channel_id, limit = 50, before } = await req.json()

    if (!user_id || !channel_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or channel_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the user's Discord access token
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', user_id)
      .eq('platform', 'discord')
      .single()

    if (accountError || !account) {
      console.error('Discord account error:', accountError)
      return new Response(
        JSON.stringify({ error: 'Discord account not connected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let accessToken = account.access_token
    
    // Check if token is expired and refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
      console.log('Token expired, refreshing...')
      try {
        const tokenData = await refreshDiscordToken(account.refresh_token)
        accessToken = tokenData.access_token
        
        // Update the token in database
        await supabaseClient
          .from('connected_accounts')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || account.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          })
          .eq('user_id', user_id)
          .eq('platform', 'discord')
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Discord token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Build URL with query parameters
    let url = `https://discord.com/api/v10/channels/${channel_id}/messages?limit=${limit}`
    if (before) {
      url += `&before=${before}`
    }

    // Fetch messages from the channel
    const messagesResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      console.error('Discord API error:', messagesResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: `Discord API error: ${messagesResponse.status}` }),
        { 
          status: messagesResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const messages = await messagesResponse.json()
    console.log('Discord messages fetched:', messages.length)

    // Process messages to extract useful data
    const processedMessages = messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        avatar: message.author.avatar,
        display_name: message.author.global_name || message.author.username
      },
      timestamp: message.timestamp,
      edited_timestamp: message.edited_timestamp,
      attachments: message.attachments.map((att: any) => ({
        id: att.id,
        filename: att.filename,
        url: att.url,
        proxy_url: att.proxy_url,
        size: att.size,
        content_type: att.content_type
      })),
      embeds: message.embeds,
      reactions: message.reactions,
      mentions: message.mentions,
      mention_roles: message.mention_roles,
      pinned: message.pinned,
      type: message.type
    }))

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages: processedMessages,
        channel_id: channel_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
