
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
    const state = url.searchParams.get('state') // This is the user_id
    const error = url.searchParams.get('error')

    if (error) {
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
      `, { 
        headers: { 'Content-Type': 'text/html' } 
      })
    }

    if (!code || !state) {
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
      `, { 
        headers: { 'Content-Type': 'text/html' } 
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('DISCORD_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('DISCORD_CLIENT_SECRET') ?? '',
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
      `, { 
        headers: { 'Content-Type': 'text/html' } 
      })
    }

    const tokenData = await tokenResponse.json()

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
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
      `, { 
        headers: { 'Content-Type': 'text/html' } 
      })
    }

    const userData = await userResponse.json()

    // Store the connection in database
    const { error: insertError } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id: state,
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
      `, { 
        headers: { 'Content-Type': 'text/html' } 
      })
    }

    // Automatically fetch and store guilds
    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (guildsResponse.ok) {
      const guilds = await guildsResponse.json()
      
      for (const guild of guilds) {
        await supabaseClient
          .from('synced_groups')
          .upsert({
            user_id: state,
            platform: 'discord',
            group_id: guild.id,
            group_name: guild.name,
            group_avatar: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
            member_count: guild.approximate_member_count || null,
            is_synced: false,
          })
      }
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
    `, { 
      headers: { 'Content-Type': 'text/html' } 
    })

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
    `, { 
      headers: { 'Content-Type': 'text/html' } 
    })
  }
})
