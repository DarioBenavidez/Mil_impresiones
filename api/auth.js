export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.SITE_URL}/api/callback`,
    response_type: 'code',
    scope: 'openid email',
    access_type: 'online',
  });
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><body><script>
    if (window.opener) {
      window.opener.postMessage('authorizing:github', '*');
    }
    window.location.href = ${JSON.stringify(googleUrl)};
  <\/script></body></html>`);
}
