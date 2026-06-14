// api/mp-preference.js — Vercel serverless function
// Crea una preferencia de pago en MercadoPago Checkout Pro
//
// Para activar: agrega en Vercel Dashboard > Settings > Environment Variables:
//   MP_ACCESS_TOKEN = APP_USR-xxxxxxxxxxxx (token de producción de tu cuenta MP)
//
// Docs: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    // MP no configurado aún — devuelve estado pendiente para que el cliente use WhatsApp
    return res.status(200).json({
      status: 'pending_setup',
      message: 'MercadoPago no configurado. Coordinaremos el pago por WhatsApp.'
    });
  }

  try {
    const { items, payer, external_reference, wsp, envio, dir, obs } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Items requeridos' });
    }

    const rawSiteUrl = process.env.SITE_URL || 'https://www.milimpresiones.com';
    const siteUrl = rawSiteUrl.replace(/\/+$/, '');

    // Construir additional_info con los datos extra del pedido
    // MP los devuelve cuando consultamos el pago en el webhook
    const additionalInfo = {
      items: items.map(function(item) {
        return {
          id: String(item.id),
          title: item.name,
          quantity: item.qty || 1,
          unit_price: Number(item.price),
          currency_id: 'ARS',
        };
      }),
      payer: Object.assign({}, payer ? {
        first_name: payer.name,
        last_name: payer.surname,
      } : {}, wsp ? { phone: { number: wsp } } : {}),
    };
    if (dir) {
      additionalInfo.shipments = { receiver_address: { street_name: dir } };
    }
    // Guardar envío y obs en description del primer item (campo libre de MP)
    var extras = [];
    if (envio) extras.push('Envio:' + envio);
    if (obs) extras.push('Obs:' + obs);
    if (extras.length && additionalInfo.items.length) {
      additionalInfo.items[0].description = extras.join(' | ');
    }

    const body = {
      items: items.map(function(item) {
        return {
          id: String(item.id),
          title: item.name,
          quantity: item.qty || 1,
          unit_price: Number(item.price),
          currency_id: 'ARS',
        };
      }),
      additional_info: additionalInfo,
      payer: payer || {},
      back_urls: {
        success: siteUrl + '/carrito?status=success',
        failure: siteUrl + '/carrito?status=failure',
        pending: siteUrl + '/carrito?status=pending',
      },
      auto_return: 'approved',
      payment_methods: {
        installments: 12,
      },
      statement_descriptor: 'MIL IMPRESIONES',
      external_reference: external_reference || 'MI-' + Date.now().toString(36).toUpperCase(),
      notification_url: siteUrl + '/api/mp-webhook',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
      body: JSON.stringify(body),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error('MP error:', err);
      return res.status(500).json({ error: 'Error al crear preferencia MP' });
    }

    const data = await mpRes.json();
    return res.status(200).json({
      status: 'ok',
      init_point: data.init_point,         // producción
      sandbox_init_point: data.sandbox_init_point, // pruebas
      preference_id: data.id,
    });

  } catch (err) {
    console.error('MP handler error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
