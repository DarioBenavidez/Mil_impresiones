const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').map(u => u.trim().toLowerCase()).filter(Boolean);

function sendMessage(res, content) {
  const isError = content.includes(':error:');
  const label = isError ? '❌ Error' : '✅ Autenticado';
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:32px;background:#f5f5f5">
  <h2 style="color:${isError?'#c00':'#090'}">${label}</h2>
  <pre id="dbg" style="font-size:12px;word-break:break-all;background:#fff;padding:12px;border-radius:6px"></pre>
  <p id="countdown" style="color:#666;font-size:13px"></p>
  <script>
    var msg = ${JSON.stringify(content)};
    document.getElementById('dbg').textContent = msg;
    var opener_ok = !!(window.opener && window.opener.postMessage);
    var sec = 5;
    var iv = setInterval(function(){
      document.getElementById('countdown').textContent =
        'opener=' + opener_ok + ' · cerrando en ' + (sec--) + 's';
      if (sec < 0) { clearInterval(iv); window.close(); }
    }, 1000);
    try {
      if (opener_ok) {
        window.opener.postMessage(msg, '*');
      } else {
        localStorage.setItem('decap-cms-oauth-result', msg);
      }
    } catch(e) {
      try { localStorage.setItem('decap-cms-oauth-result', msg); } catch(e2) {}
    }
  <\/script></body></html>`);
}

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
    return sendMessage(res, `authorization:github:error:${JSON.stringify(data)}`);
  }

  if (ALLOWED_USERS.length > 0) {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${data.access_token}`, 'User-Agent': '1000impresiones-cms' }
    });
    const user = await userRes.json();
    if (!ALLOWED_USERS.includes(user.login?.toLowerCase())) {
      return sendMessage(res, `authorization:github:error:${JSON.stringify({ error: 'access_denied', error_description: 'Usuario no autorizado' })}`);
    }
  }

  sendMessage(res, `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`);
}
