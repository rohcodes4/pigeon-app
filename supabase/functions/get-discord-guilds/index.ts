
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
      .select('access_token, platform_user_id')
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

    // Fetch user's Discord guilds
    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!guildsResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Discord guilds' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const guilds = await guildsResponse.json()
    console.log('Discord guilds fetched:', guilds.length)

    // Store guilds in database
    for (const guild of guilds) {
      await supabaseClient
        .from('synced_groups')
        .upsert({
          user_id,
          platform: 'discord',
          group_id: guild.id,
          group_name: guild.name,
          group_avatar: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          member_count: guild.approximate_member_count || null,
          is_synced: false,
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        guilds: guilds.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          member_count: g.approximate_member_count
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
