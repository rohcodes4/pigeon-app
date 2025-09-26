
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
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    console.log('Discord auth received:', { code: !!code, state, error })

    if (error) {
      console.error('Discord OAuth error:', error)
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ 
                type: 'DISCORD_AUTH_ERROR', 
                error: '${error}' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    if (!code || !state) {
      console.error('Missing code or state', { code: !!code, state })
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ 
                type: 'DISCORD_AUTH_ERROR', 
                error: 'Missing authorization code or state' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    let userId;
    try {
      const stateObj = JSON.parse(decodeURIComponent(state));
      userId = stateObj.userId;
    } catch {
      userId = state;
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const discordClientId = Deno.env.get('DISCORD_CLIENT_ID')
    const discordClientSecret = Deno.env.get('DISCORD_CLIENT_SECRET')

    if (!discordClientId || !discordClientSecret) {
      console.error('Discord credentials not configured')
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ 
                type: 'DISCORD_AUTH_ERROR', 
                error: 'Discord credentials not configured' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: discordClientId,
        client_secret: discordClientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/discord-auth`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ 
                type: 'DISCORD_AUTH_ERROR', 
                error: 'Failed to exchange authorization code' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to fetch user info')
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ 
                type: 'DISCORD_AUTH_ERROR', 
                error: 'Failed to fetch user info' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    const userData = await userResponse.json()
    console.log('User data fetched successfully')

    // Store the connection in database
    const { error: insertError } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id: userId,
        platform: 'discord',
        platform_user_id: userData.id,
        platform_username: userData.username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        connected_at: new Date().toISOString(),
        metadata: {
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          email: userData.email,
          global_name: userData.global_name,
        },
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ 
                type: 'DISCORD_AUTH_ERROR', 
                error: 'Failed to save connection' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // Fetch user's guilds (servers)
    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (guildsResponse.ok) {
      const guilds = await guildsResponse.json()
      console.log(`Fetched ${guilds.length} guilds for user`)
      
      for (const guild of guilds) {
        await supabaseClient
          .from('synced_groups')
          .upsert({
            user_id: userId,
            platform: 'discord',
            group_id: guild.id,
            group_name: guild.name,
            group_avatar: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
            member_count: guild.approximate_member_count || null,
            is_synced: false,
          })
      }
      console.log('Successfully stored guilds')
    }

    // Fetch DMs (Direct Messages)
    const dmsResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (dmsResponse.ok) {
      const dms = await dmsResponse.json()
      console.log(`Fetched ${dms.length} DM channels for user`)
      
      for (const dm of dms) {
        if (dm.type === 1) { // DM channel
          const recipientName = dm.recipients?.[0]?.username || 'Unknown User'
          await supabaseClient
            .from('synced_groups')
            .upsert({
              user_id: userId,
              platform: 'discord',
              group_id: dm.id,
              group_name: `DM: ${recipientName}`,
              group_avatar: dm.recipients?.[0]?.avatar 
                ? `https://cdn.discordapp.com/avatars/${dm.recipients[0].id}/${dm.recipients[0].avatar}.png`
                : null,
              member_count: 2,
              is_synced: false,
            })
        }
      }
      console.log('Successfully stored DM channels')
    }

    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ 
              type: 'DISCORD_AUTH_SUCCESS', 
              data: ${JSON.stringify(userData)} 
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } })

  } catch (error) {
    console.error('Discord auth error:', error)
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ 
              type: 'DISCORD_AUTH_ERROR', 
              error: 'Internal server error' 
            }, '*');
            window.close();
          </script>
        </body>
        </html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
})
