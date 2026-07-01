// api/admin-upload.js — Sube una imagen al repo via GitHub API
// Body: { filename, base64, folder? }

import { createHmac, timingSafeEqual } from 'crypto';

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

  const { filename, base64 } = req.body || {};
  if (!filename || !base64) return res.status(400).json({ error: 'filename y base64 requeridos' });

  const repo = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const ghToken = process.env.GITHUB_TOKEN;
  if (!ghToken) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

  // Sanitizar nombre de archivo. La carpeta de destino es fija (no la elige
  // el cliente) para que no se pueda usar para escribir fuera de uploads.
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  if (!safeName || safeName === '.' || safeName === '..') {
    return res.status(400).json({ error: 'filename inválido' });
  }
  const uploadFolder = 'assets/uploads';
  const filePath = `${uploadFolder}/${safeName}`;

  const apiBase = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `token ${ghToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'MilImpresiones-Admin',
  };

  // Verificar si ya existe
  let sha;
  try {
    const getRes = await fetch(apiBase, { headers });
    if (getRes.ok) { const d = await getRes.json(); sha = d.sha; }
  } catch (_) {}

  const body = {
    message: `admin: sube ${safeName}`,
    content: base64.replace(/^data:[^;]+;base64,/, ''),
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

  return res.status(200).json({ ok: true, path: `/${filePath}` });
}
