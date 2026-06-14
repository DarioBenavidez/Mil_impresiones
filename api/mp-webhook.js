// api/mp-webhook.js — Recibe notificaciones de MercadoPago (IPN/webhook)
// MP llama a este endpoint cuando cambia el estado de un pago.
// Así el email se envía incluso si el usuario no vuelve a la página.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data, topic } = req.body || {};
  const paymentId = data?.id || req.query.id;
  const notifTopic = type || topic;

  // Solo procesamos notificaciones de tipo "payment"
  // merchant_order también llega para el mismo pago y causaría email duplicado
  if (notifTopic !== 'payment') {
    return res.status(200).end();
  }

  if (!paymentId) return res.status(200).end();

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  if (!accessToken || !resendKey) return res.status(200).end();

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!mpRes.ok) return res.status(200).end();

    const payment = await mpRes.json();

    // Solo actuar cuando el pago esté aprobado
    if (payment.status !== 'approved') return res.status(200).end();

    // Armar datos del pedido a partir de lo que guarda MP
    const addInfo = payment.additional_info || {};
    const payer = addInfo.payer || {};
    const mpPayer = payment.payer || {};

    const rawItems = addInfo.items || [];
    const firstItemDesc = (rawItems[0] && rawItems[0].description) || '';
    const descParts = Object.fromEntries(
      firstItemDesc.split(' | ').map(function(p) {
        var idx = p.indexOf(':');
        return idx > -1 ? [p.slice(0, idx), p.slice(idx + 1)] : [p, ''];
      })
    );

    const items = rawItems.map(function(i) {
      return {
        name: i.title || i.id,
        qty: parseInt(i.quantity) || 1,
        price: parseFloat(i.unit_price) || 0,
      };
    });

    const wspRaw = (payer.phone && payer.phone.number) || '';
    const wspClean = wspRaw.replace(/\D/g, '');
    const totalNum = payment.transaction_amount || 0;

    const order = {
      code: payment.external_reference || ('MP-' + String(paymentId)),
      total: '$' + totalNum.toLocaleString('es-AR'),
      nombre: [payer.first_name, payer.last_name].filter(Boolean).join(' ') || mpPayer.first_name || 'Cliente',
      dni: (mpPayer.identification && mpPayer.identification.number) || '-',
      wsp: wspRaw || '-',
      wspClean: wspClean,
      email: payer.email || mpPayer.email || '',
      empresa: '',
      envio: descParts['Envio'] || (addInfo.shipments && addInfo.shipments.receiver_address && addInfo.shipments.receiver_address.street_name) || 'Retiro en local',
      dir: (addInfo.shipments && addInfo.shipments.receiver_address && addInfo.shipments.receiver_address.street_name) || '',
      obs: descParts['Obs'] || '',
      items: items,
      pago: 'Mercado Pago ✅ APROBADO (#' + paymentId + ')',
    };

    const domainVerified = process.env.RESEND_DOMAIN_VERIFIED === 'true';
    const fromEmail = domainVerified
      ? 'Mil Impresiones <ventas@milimpresiones.com>'
      : 'Mil Impresiones <onboarding@resend.dev>';

    const itemsHtml = items.map(function(i) {
      return '<tr>'
        + '<td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">' + i.name + '</td>'
        + '<td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">' + i.qty + '</td>'
        + '<td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">$' + (i.price * i.qty).toLocaleString('es-AR') + '</td>'
        + '</tr>';
    }).join('');

    const storeHtml = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>'
      + '<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif">'
      + '<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">'
      + '<div style="background:#EC008C;padding:24px 32px">'
      + '<h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">✅ Pago aprobado — ' + order.code + '</h1>'
      + '<p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px">ID de pago MP: ' + paymentId + '</p>'
      + '</div>'
      + '<div style="padding:28px 32px">'
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">'
      + '<tr><td style="padding:6px 0;color:#888;font-size:13px;width:130px">Nombre</td><td style="padding:6px 0;font-size:14px;font-weight:600">' + order.nombre + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#888;font-size:13px">DNI/CUIT</td><td style="padding:6px 0;font-size:14px">' + order.dni + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#888;font-size:13px">WhatsApp</td><td style="padding:6px 0;font-size:14px">' + order.wsp + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#888;font-size:13px">Email</td><td style="padding:6px 0;font-size:14px">' + order.email + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#888;font-size:13px">Envío</td><td style="padding:6px 0;font-size:14px">' + order.envio + '</td></tr>'
      + (order.dir ? '<tr><td style="padding:6px 0;color:#888;font-size:13px">Dirección</td><td style="padding:6px 0;font-size:14px">' + order.dir + '</td></tr>' : '')
      + '<tr><td style="padding:6px 0;color:#888;font-size:13px">Monto</td><td style="padding:6px 0;font-size:14px;color:#EC008C;font-weight:700">' + order.total + '</td></tr>'
      + '</table>'
      + (order.obs ? '<div style="padding:12px;background:#fff8e1;border-radius:8px;font-size:13px;color:#7a6400;margin-bottom:20px"><strong>Observaciones:</strong> ' + order.obs + '</div>' : '')
      + '<h3 style="margin:0 0 12px;font-size:15px;color:#333">Productos</h3>'
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">'
      + '<thead><tr style="background:#f8f8f8">'
      + '<th style="padding:8px 12px;text-align:left;font-size:13px;color:#555">Producto</th>'
      + '<th style="padding:8px 12px;text-align:center;font-size:13px;color:#555">Qty</th>'
      + '<th style="padding:8px 12px;text-align:right;font-size:13px;color:#555">Subtotal</th>'
      + '</tr></thead><tbody>' + itemsHtml + '</tbody>'
      + '</table>'
      + '</div>'
      + '<div style="padding:16px 32px;background:#f8f8f8;text-align:center">'
      + (order.wspClean ? '<p style="margin:0 0 8px;font-size:13px;color:#666">Contactar al cliente</p><a href="https://wa.me/549' + order.wspClean + '" style="display:inline-block;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">WhatsApp ' + order.wsp + '</a>' : '<p style="margin:0;font-size:13px;color:#666">Contactar al cliente por email: ' + order.email + '</p>')
      + '</div>'
      + '</div></body></html>';

    const sends = [
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: ['ventas@milimpresiones.com'],
          subject: '✅ Pago aprobado ' + order.code + ' — ' + order.nombre,
          html: storeHtml,
        }),
      }),
    ];

    // Email de confirmación al cliente si tenemos su email
    if (order.email) {
      const clientHtml = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>'
        + '<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif">'
        + '<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">'
        + '<div style="background:#EC008C;padding:24px 32px;text-align:center">'
        + '<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">¡Pago recibido!</h1>'
        + '<p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px">Código: ' + order.code + '</p>'
        + '</div>'
        + '<div style="padding:28px 32px">'
        + '<p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 20px">Hola <strong>' + order.nombre.split(' ')[0] + '</strong>, tu pago fue aprobado. En breve te contactamos por WhatsApp para coordinar los detalles de producción y entrega.</p>'
        + '<div style="padding:14px 12px;background:#f8f8f8;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between">'
        + '<span style="font-weight:700;font-size:16px">Total pagado</span>'
        + '<span style="font-weight:700;font-size:16px;color:#EC008C">' + order.total + '</span>'
        + '</div>'
        + '</div>'
        + '<div style="padding:20px 32px;background:#f8f8f8;text-align:center">'
        + '<p style="margin:0 0 12px;font-size:13px;color:#666">¿Tenés alguna duda?</p>'
        + '<a href="https://wa.me/5491136365889" style="display:inline-block;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">WhatsApp</a>'
        + '</div>'
        + '</div></body></html>';

      sends.push(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [order.email],
          subject: '✅ Pago aprobado — ' + order.code + ' | Mil Impresiones',
          html: clientHtml,
        }),
      }));
    }

    await Promise.all(sends);
    return res.status(200).end();

  } catch (err) {
    console.error('mp-webhook error:', err);
    return res.status(200).end(); // Siempre 200 para que MP no reintente
  }
}
