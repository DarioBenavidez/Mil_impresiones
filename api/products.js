// api/products.js — Sirve productos.json directo desde GitHub (siempre actualizado)
// Así los cambios del admin se ven de inmediato sin necesitar un nuevo deploy

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const repo = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const ghToken = process.env.GITHUB_TOKEN;

  try {
    const headers = { 'User-Agent': 'MilImpresiones' };
    if (ghToken) headers['Authorization'] = 'token ' + ghToken;

    const r = await fetch(
      `https://api.github.com/repos/${repo}/contents/content/productos.json`,
      { headers }
    );

    if (!r.ok) throw new Error('GitHub error ' + r.status);

    const data = await r.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(content);

  } catch (err) {
    // Fallback al archivo estático del deploy si GitHub falla
    return res.redirect(302, '/content/productos.json');
  }
}
