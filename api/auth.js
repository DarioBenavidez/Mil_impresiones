export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID,
    redirect_uri: `${process.env.SITE_URL}/api/callback`,
    scope: 'repo,user'
  });
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
