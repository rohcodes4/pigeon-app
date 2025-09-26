
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

    // Fetch user's DMs from Discord
    const dmsResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!dmsResponse.ok) {
      const errorText = await dmsResponse.text()
      console.error('Discord API error:', dmsResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: `Discord API error: ${dmsResponse.status}` }),
        { 
          status: dmsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const dms = await dmsResponse.json()
    console.log('Discord DMs fetched:', dms.length)

    // Store DMs in database
    for (const dm of dms) {
      if (dm.type === 1) { // DM channel type
        const recipient = dm.recipients?.[0]
        if (recipient) {
          await supabaseClient
            .from('synced_groups')
            .upsert({
              user_id,
              platform: 'discord',
              group_id: dm.id,
              group_name: recipient.global_name || recipient.username,
              group_avatar: recipient.avatar ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png` : null,
              member_count: 2,
              is_synced: true,
              is_group: false,
              metadata: {
                recipient_id: recipient.id,
                channel_type: dm.type,
                recipient_username: recipient.username
              }
            })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        dms: dms.map((dm: any) => ({
          id: dm.id,
          type: dm.type,
          recipient: dm.recipients?.[0]
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
