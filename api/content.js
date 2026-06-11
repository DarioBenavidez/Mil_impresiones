// api/content.js — Lee content JSON directo de GitHub (sin esperar redeploy de Vercel)
// Flujo: admin guarda → GitHub actualiza → este endpoint sirve siempre la versión más reciente

const ALLOWED = new Set([
  'config-visual.json',
  'menu-categorias.json',
  'why-us.json',
  'ticker.json',
  'productos.json',
  'trabajos.json',
  'testimonios.json',
]);

export default async function handler(req, res) {
  const file = req.query.file;
  if (!file || !ALLOWED.has(file)) {
    return res.status(400).json({ error: 'Archivo no permitido' });
  }

  const repo   = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const token  = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/content/${file}`;

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'MilImpresiones-Content',
  };
  if (token) headers.Authorization = `token ${token}`;

  try {
    const ghRes = await fetch(apiUrl, { headers });
    if (ghRes.status === 404) return res.status(200).json({});
    if (!ghRes.ok) return res.status(502).json({ error: 'GitHub no disponible' });

    const data    = await ghRes.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(content);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
