const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').map(u => u.trim().toLowerCase()).filter(Boolean);

export default async function handler(req, res) {
  const { code } = req.query;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code
    })
  });

  const data = await tokenRes.json();

  if (data.error) {
    const content = `authorization:github:error:${JSON.stringify(data)}`;
    res.setHeader('Content-Type', 'text/html');
    return res.send(`<script>window.opener.postMessage('${content}','*');window.close();</script>`);
  }

  if (ALLOWED_USERS.length > 0) {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${data.access_token}`, 'User-Agent': '1000impresiones-cms' }
    });
    const user = await userRes.json();
    if (!ALLOWED_USERS.includes(user.login?.toLowerCase())) {
      const content = `authorization:github:error:${JSON.stringify({ error: 'access_denied', error_description: 'Usuario no autorizado' })}`;
      res.setHeader('Content-Type', 'text/html');
      return res.send(`<script>window.opener.postMessage('${content}','*');window.close();</script>`);
    }
  }

  const content = `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`;
  res.setHeader('Content-Type', 'text/html');
  res.send(`<script>window.opener.postMessage('${content}','*');window.close();</script>`);
}
