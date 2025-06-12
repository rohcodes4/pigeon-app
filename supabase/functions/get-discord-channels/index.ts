
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
      .select('access_token')
      .eq('user_id', user_id)
      .eq('platform', 'discord')
      .single()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Discord account not connected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch channels for the guild
    const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guild_id}/channels`, {
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!channelsResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Discord channels' }),
        { 
          status: 400, 
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
          is_synced: false,
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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
