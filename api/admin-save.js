// api/admin-save.js — Guarda un archivo JSON en el repo via GitHub API
// Env vars necesarias en Vercel:
//   ADMIN_PASSWORD, GITHUB_TOKEN (PAT con permisos contents:write)
//   GITHUB_REPO = DarioBenavidez/Mil_impresiones

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

  const { path, content } = req.body || {};
  if (!path || content === undefined) return res.status(400).json({ error: 'path y content requeridos' });

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
