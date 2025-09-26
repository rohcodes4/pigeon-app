
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

    const { user_id, guild_id } = await req.json()

    if (!user_id || !guild_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or guild_id' }),
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

    // Fetch channels for the guild
    const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guild_id}/channels`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!channelsResponse.ok) {
      const errorText = await channelsResponse.text()
      console.error('Discord API error:', channelsResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: `Discord API error: ${channelsResponse.status}` }),
        { 
          status: channelsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const channels = await channelsResponse.json()
    console.log('Discord channels fetched:', channels.length)

    // Filter for text channels and store them
    const textChannels = channels.filter((channel: any) => 
      channel.type === 0 || channel.type === 5 // Text channels and announcement channels
    )

    for (const channel of textChannels) {
      await supabaseClient
        .from('synced_groups')
        .upsert({
          user_id,
          platform: 'discord',
          group_id: channel.id,
          group_name: `#${channel.name}`,
          group_avatar: null,
          member_count: null,
          is_synced: true,
          is_group: true,
          metadata: {
            guild_id: guild_id,
            channel_type: channel.type,
            parent_id: channel.parent_id,
            topic: channel.topic
          }
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        channels: textChannels.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          topic: c.topic,
          parent_id: c.parent_id
        }))
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
