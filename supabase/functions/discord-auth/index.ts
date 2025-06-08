
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

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // Contains user_id
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: '${error}' }, '*'); window.close();</script><p>Authorization cancelled</p></body></html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    if (!code || !state) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: 'Missing parameters' }, '*'); window.close();</script><p>Missing code or state parameter</p></body></html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    const discordClientId = Deno.env.get('DISCORD_CLIENT_ID')
    const discordClientSecret = Deno.env.get('DISCORD_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/discord-auth`
    
    if (!discordClientId || !discordClientSecret) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: 'Discord credentials not configured' }, '*'); window.close();</script><p>Discord credentials not configured</p></body></html>`,
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    // Exchange code for Discord access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: discordClientId,
        client_secret: discordClientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Discord token exchange failed:', errorText)
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: 'Token exchange failed' }, '*'); window.close();</script><p>Failed to authenticate with Discord</p></body></html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: 'User info failed' }, '*'); window.close();</script><p>Failed to get Discord user info</p></body></html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    const discordUserData = await userResponse.json()

    // Get Discord guilds (servers)
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    let guilds = []
    if (guildsResponse.ok) {
      guilds = await guildsResponse.json()
    }

    // Store the connected account
    const { error: dbError } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id: state,
        platform: 'discord',
        platform_user_id: discordUserData.id,
        platform_username: discordUserData.username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: 'Database error' }, '*'); window.close();</script><p>Failed to save connection</p></body></html>`,
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    // Store available guilds/servers
    for (const guild of guilds) {
      await supabaseClient
        .from('synced_groups')
        .upsert({
          user_id: state,
          platform: 'discord',
          group_id: guild.id,
          group_name: guild.name,
          group_avatar: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          member_count: guild.approximate_member_count || 0,
          is_synced: false, // Default to not synced, user can choose
        })
    }

    return new Response(
      `<html><body><script>
        window.opener?.postMessage({ type: 'DISCORD_AUTH_SUCCESS', data: ${JSON.stringify(discordUserData)} }, '*');
        window.close();
      </script><p>Discord connected successfully! You can close this window.</p></body></html>`,
      { 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      `<html><body><script>window.opener?.postMessage({ type: 'DISCORD_AUTH_ERROR', error: 'Internal server error' }, '*'); window.close();</script><p>Internal server error</p></body></html>`,
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    )
  }
})
