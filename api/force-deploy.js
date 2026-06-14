// api/force-deploy.js — Fuerza un redeploy en Vercel creando un commit mínimo
import { createHash } from 'crypto';

function verifyToken(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  const expected = createHash('sha256').update(process.env.ADMIN_PASSWORD + 'mili2026').digest('hex');
  return token === expected;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyToken(req)) return res.status(401).json({ error: 'No autorizado' });

  const repo = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const ghToken = process.env.GITHUB_TOKEN;
  if (!ghToken) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

  const path = 'content/.deploy-trigger';
  const apiBase = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${ghToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'MilImpresiones-Admin',
  };

  let sha;
  try {
    const getRes = await fetch(apiBase, { headers });
    if (getRes.ok) sha = (await getRes.json()).sha;
  } catch (_) {}

  const timestamp = new Date().toISOString();
  const body = {
    message: `deploy: forzar actualización ${timestamp}`,
    content: Buffer.from(timestamp + '\n').toString('base64'),
    branch: 'main',
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const err = await putRes.text();
    return res.status(500).json({ error: 'GitHub error', detail: err });
  }

  return res.status(200).json({ ok: true, timestamp });
}
