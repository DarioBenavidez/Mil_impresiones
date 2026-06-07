// api/admin-upload.js — Sube una imagen al repo via GitHub API
// Body: { filename, base64, folder? }

import { createHash } from 'crypto';

function verifyToken(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const expected = createHash('sha256').update(adminPassword + 'mili2026').digest('hex');
  return token === expected;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyToken(req)) return res.status(401).json({ error: 'No autorizado' });

  const { filename, base64, folder } = req.body || {};
  if (!filename || !base64) return res.status(400).json({ error: 'filename y base64 requeridos' });

  const repo = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const ghToken = process.env.GITHUB_TOKEN;
  if (!ghToken) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

  // Sanitizar nombre de archivo
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const uploadFolder = folder || 'assets/uploads';
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
