const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

function sendMessage(res, content) {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><body>
  <script>
    var msg = ${JSON.stringify(content)};
    try { localStorage.setItem('decap-cms-oauth-result', msg); } catch(e) {}
    try {
      if (window.opener && window.opener.postMessage) {
        window.opener.postMessage(msg, '*');
      }
    } catch(e) {}
    setTimeout(function(){ window.close(); }, 500);
  <\/script></body></html>`);
}

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return sendMessage(res, `authorization:github:error:${JSON.stringify({ error })}`);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.SITE_URL}/api/callback`,
      grant_type: 'authorization_code',
    })
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return sendMessage(res, `authorization:github:error:${JSON.stringify(tokenData)}`);
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const user = await userRes.json();

  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(user.email?.toLowerCase())) {
    return sendMessage(res, `authorization:github:error:${JSON.stringify({ error: 'access_denied', error_description: 'Email no autorizado: ' + user.email })}`);
  }

  sendMessage(res, `authorization:github:success:${JSON.stringify({ token: process.env.GITHUB_PAT, provider: 'github' })}`);
}
