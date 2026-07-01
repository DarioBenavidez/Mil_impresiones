// api/admin-save.js — Guarda un archivo JSON en el repo via GitHub API
// Env vars necesarias en Vercel:
//   ADMIN_PASSWORD, GITHUB_TOKEN (PAT con permisos contents:write)
//   GITHUB_REPO = DarioBenavidez/Mil_impresiones

import { createHmac, timingSafeEqual } from 'crypto';

// Únicos archivos que el panel de admin tiene permitido escribir.
// Debe coincidir con el ALLOWED de api/content.js.
const ALLOWED_FILES = new Set([
  'config-visual.json',
  'menu-categorias.json',
  'why-us.json',
  'ticker.json',
  'productos.json',
  'trabajos.json',
  'testimonios.json',
  'pagos.json',
  'proceso.json',
]);

// Token = "<expiresAt>.<hmac(expiresAt)>", generado por api/admin-auth.js.
function verifyToken(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const expectedSig = createHmac('sha256', process.env.ADMIN_PASSWORD + 'mili2026').update(expiresStr).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyToken(req)) return res.status(401).json({ error: 'No autorizado' });

  const { path: rawPath, content } = req.body || {};
  if (!rawPath || content === undefined) return res.status(400).json({ error: 'path y content requeridos' });

  const filename = rawPath.replace(/^content\//, '');
  if (rawPath !== `content/${filename}` || !ALLOWED_FILES.has(filename)) {
    return res.status(400).json({ error: 'path no permitido' });
  }
  const path = rawPath;

  const repo = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const ghToken = process.env.GITHUB_TOKEN;

  if (!ghToken) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

  const apiBase = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${ghToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'MilImpresiones-Admin',
  };

  // Obtener SHA actual del archivo (necesario para actualizar)
  let sha;
  try {
    const getRes = await fetch(apiBase, { headers });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (_) {}

  const body = {
    message: `admin: actualiza ${path} [vercel skip]`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch: 'main',
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return res.status(500).json({ error: 'GitHub error', detail: err });
  }

  return res.status(200).json({ ok: true });
}
