// api/send-email.js — Envía emails de notificación de pedidos via Resend
// Body: { order, type }
//   type: 'store' | 'client' | 'both'
//   order: { code, nombre, dni, wsp, email, empresa, envio, dir, obs, items, total, pago }

// Campos como nombre/dni/obs/dir vienen del formulario del cliente: hay que
// escaparlos antes de meterlos en el HTML del email (si no, un cliente podría
// inyectar markup/links en el mail que recibe ventas@).
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY no configurado' });

  const { order: rawOrder, type = 'both' } = req.body || {};
  if (!rawOrder) return res.status(400).json({ error: 'order requerido' });

  const order = {
    code: escapeHtml(rawOrder.code),
    nombre: escapeHtml(rawOrder.nombre),
    dni: escapeHtml(rawOrder.dni),
    wsp: escapeHtml(rawOrder.wsp),
    email: escapeHtml(rawOrder.email),
    empresa: escapeHtml(rawOrder.empresa),
    envio: escapeHtml(rawOrder.envio),
    dir: escapeHtml(rawOrder.dir),
    obs: escapeHtml(rawOrder.obs),
    total: escapeHtml(rawOrder.total),
    pago: escapeHtml(rawOrder.pago),
    items: rawOrder.items,
  };

  const domainVerified = process.env.RESEND_DOMAIN_VERIFIED === 'true';
  const fromEmail = domainVerified
    ? 'Mil Impresiones <ventas@milimpresiones.com>'
    : 'Mil Impresiones <onboarding@resend.dev>';
  const storeEmail = 'ventas@milimpresiones.com';

  const itemsHtml = (order.items || []).map(function(i) {
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${escapeHtml(i.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${Number(i.qty) || 0}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">$${((Number(i.price) || 0) * (Number(i.qty) || 0)).toLocaleString('es-AR')}</td>
    </tr>`;
  }).join('');

  const storeHtml = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:#EC008C;padding:24px 32px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">🛒 Nuevo pedido — ${order.code}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px">Pago: ${order.pago}</p>
  </div>
  <div style="padding:28px 32px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:6px 0;color:#888;font-size:13px;width:130px">Nombre</td><td style="padding:6px 0;font-size:14px;font-weight:600">${order.nombre}</td></tr>
      <tr><td style="padding:6px 0;color:#888;font-size:13px">DNI/CUIT</td><td style="padding:6px 0;font-size:14px">${order.dni}</td></tr>
      <tr><td style="padding:6px 0;color:#888;font-size:13px">WhatsApp</td><td style="padding:6px 0;font-size:14px">${order.wsp}</td></tr>
      <tr><td style="padding:6px 0;color:#888;font-size:13px">Email</td><td style="padding:6px 0;font-size:14px">${order.email}</td></tr>
      ${order.empresa ? `<tr><td style="padding:6px 0;color:#888;font-size:13px">Empresa</td><td style="padding:6px 0;font-size:14px">${order.empresa}</td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#888;font-size:13px">Envío</td><td style="padding:6px 0;font-size:14px">${order.envio}${order.dir ? ' — ' + order.dir : ''}</td></tr>
    </table>
    <h3 style="margin:0 0 12px;font-size:15px;color:#333">Productos</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead><tr style="background:#f8f8f8">
        <th style="padding:8px 12px;text-align:left;font-size:13px;color:#555">Producto</th>
        <th style="padding:8px 12px;text-align:center;font-size:13px;color:#555">Qty</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px;color:#555">Subtotal</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;padding:14px 12px;background:#f8f8f8;border-radius:8px;margin-bottom:20px">
      <span style="font-weight:700;font-size:16px">Total estimado</span>
      <span style="font-weight:700;font-size:16px;color:#EC008C">${order.total}</span>
    </div>
    ${order.obs ? `<div style="padding:12px;background:#fff8e1;border-radius:8px;font-size:13px;color:#7a6400"><strong>Observaciones:</strong> ${order.obs}</div>` : ''}
  </div>
  <div style="padding:16px 32px;background:#f8f8f8;text-align:center">
    <a href="https://wa.me/549${order.wsp.replace(/\D/g,'')}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Responder por WhatsApp</a>
  </div>
</div>
</body></html>`;

  const clientHtml = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:#EC008C;padding:24px 32px;text-align:center">
    <img src="https://www.milimpresiones.com/assets/logo-icon-dark.png" alt="Mil Impresiones" style="height:48px;margin-bottom:12px">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">¡Pedido recibido!</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px">Código: ${order.code}</p>
  </div>
  <div style="padding:28px 32px">
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 20px">Hola <strong>${order.nombre.split(' ')[0]}</strong>, recibimos tu pedido correctamente. En breve nos comunicamos por WhatsApp para confirmar los detalles y coordinar la producción.</p>
    <h3 style="margin:0 0 12px;font-size:15px;color:#333">Resumen de tu pedido</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead><tr style="background:#f8f8f8">
        <th style="padding:8px 12px;text-align:left;font-size:13px;color:#555">Producto</th>
        <th style="padding:8px 12px;text-align:center;font-size:13px;color:#555">Qty</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px;color:#555">Subtotal</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="padding:14px 12px;background:#f8f8f8;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between">
      <span style="font-weight:700;font-size:16px">Total estimado</span>
      <span style="font-weight:700;font-size:16px;color:#EC008C">${order.total}</span>
    </div>
    <p style="font-size:12px;color:#aaa;line-height:1.5;margin:0">* El monto es orientativo. El precio final se confirma por WhatsApp antes de iniciar la producción.</p>
  </div>
  <div style="padding:20px 32px;background:#f8f8f8;text-align:center">
    <p style="margin:0 0 12px;font-size:13px;color:#666">¿Tenés alguna duda? Escribinos</p>
    <a href="https://wa.me/5491136365889" style="display:inline-block;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">WhatsApp</a>
  </div>
</div>
</body></html>`;

  const sends = [];

  if (type === 'store' || type === 'both') {
    sends.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: [storeEmail],
        subject: `🛒 Nuevo pedido ${order.code} — ${order.nombre}`,
        html: storeHtml,
      }),
    }));
  }

  if ((type === 'client' || type === 'both') && order.email) {
    sends.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: [order.email],
        subject: `✅ Pedido recibido — ${order.code} | Mil Impresiones`,
        html: clientHtml,
      }),
    }));
  }

  try {
    await Promise.all(sends);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Error al enviar email' });
  }
}
