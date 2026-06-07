// api/admin-auth.js — Verifica contraseña y devuelve token de sesión
// Env vars necesarias en Vercel:
//   ADMIN_PASSWORD = la contraseña que elijas

import { createHash } from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD no configurado en Vercel' });
  }

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  // Token = hash(password) — simple, sin expiración
  const token = createHash('sha256').update(adminPassword + 'mili2026').digest('hex');

  return res.status(200).json({ token });
}
