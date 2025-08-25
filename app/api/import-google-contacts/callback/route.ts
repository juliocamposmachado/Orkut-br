import { NextRequest } from 'next/server'
import { google } from 'googleapis'

// OAuth2 callback: exchanges the authorization code for an access token
// and returns a minimal HTML that posts the token back to the opener window.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state') || ''

    if (error) {
      const html = `<!doctype html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'google-contacts-error', error: ${JSON.stringify(error)} }, '*');
          window.close();
        }
      </script>Erro no OAuth: ${error}</body></html>`
      return new Response(html, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    if (!code) {
      const html = `<!doctype html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'google-contacts-error', error: 'missing_code' }, '*');
          window.close();
        }
      </script>Missing code</body></html>`
      return new Response(html, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)
    const accessToken = tokens.access_token

    if (!accessToken) {
      const html = `<!doctype html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'google-contacts-error', error: 'missing_access_token' }, '*');
          window.close();
        }
      </script>Missing access token</body></html>`
      return new Response(html, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    const payload = { type: 'google-contacts-token', accessToken, state }
    const html = `<!doctype html><html><body><script>
      (function(){
        try {
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, '*');
          }
        } catch (e) {}
        window.close();
      })();
    </script>Concluído. Você pode fechar esta janela.</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (e) {
    const html = `<!doctype html><html><body><script>
      if (window.opener) {
        window.opener.postMessage({ type: 'google-contacts-error', error: 'unexpected_error' }, '*');
        window.close();
      }
    </script>Erro inesperado</body></html>`
    return new Response(html, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}
