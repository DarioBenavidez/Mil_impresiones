// api/admin-auth.js — Verifica contraseña y devuelve token de sesión
// Env vars necesarias en Vercel:
//   ADMIN_PASSWORD = la contraseña que elijas

import { createHmac } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD no configurado en Vercel' });
  }

  if (!password || password !== adminPassword) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  // Token = expiresAt + firma HMAC del expiresAt, así los endpoints que lo
  // consumen pueden verificar la expiración sin guardar estado en el servidor.
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const sig = createHmac('sha256', adminPassword + 'mili2026').update(String(expires)).digest('hex');
  const token = `${expires}.${sig}`;

  return res.status(200).json({ token, expires });
}
