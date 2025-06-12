
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

    // Fetch user's DMs from Discord
    const dmsResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!dmsResponse.ok) {
      console.error('Failed to fetch Discord DMs:', await dmsResponse.text())
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Discord DMs' }),
        { 
          status: 400, 
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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
