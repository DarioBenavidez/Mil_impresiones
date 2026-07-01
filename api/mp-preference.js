// api/mp-preference.js — Vercel serverless function
// Crea una preferencia de pago en MercadoPago Checkout Pro
//
// Para activar: agrega en Vercel Dashboard > Settings > Environment Variables:
//   MP_ACCESS_TOKEN = APP_USR-xxxxxxxxxxxx (token de producción de tu cuenta MP)
//
// Docs: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post

// Trae el catálogo real desde GitHub (misma fuente que usa el admin) para no
// confiar nunca en el precio que manda el cliente al crear la preferencia de pago.
async function fetchCanonicalProducts() {
  const repo = process.env.GITHUB_REPO || 'DarioBenavidez/Mil_impresiones';
  const ghToken = process.env.GITHUB_TOKEN;
  const headers = { 'User-Agent': 'MilImpresiones' };
  if (ghToken) headers['Authorization'] = 'token ' + ghToken;

  const r = await fetch(
    `https://api.github.com/repos/${repo}/contents/content/productos.json`,
    { headers }
  );
  if (!r.ok) throw new Error('No se pudo obtener el catálogo (GitHub ' + r.status + ')');

  const data = await r.json();
  const parsed = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
  const byId = new Map();
  for (const p of parsed.products || []) byId.set(String(p.id), p);
  return byId;
}

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
    const { items: rawItems, payer, external_reference, wsp, envio, dir, obs } = req.body;

    if (!rawItems || !rawItems.length) {
      return res.status(400).json({ error: 'Items requeridos' });
    }

    // Validar cada item contra el catálogo real: nunca confiar en el precio
    // que manda el cliente (evita pagar cualquier monto manipulando el request).
    let productsById;
    try {
      productsById = await fetchCanonicalProducts();
    } catch (err) {
      console.error('No se pudo verificar el catálogo:', err.message);
      return res.status(503).json({ error: 'No se pudo verificar el catálogo, intentá de nuevo en unos segundos' });
    }

    const items = [];
    for (const raw of rawItems) {
      const product = productsById.get(String(raw.id));
      if (!product || product.hidden) {
        return res.status(400).json({ error: `Producto no disponible: ${raw.id}` });
      }

      // Si el producto tiene colores para elegir, el cliente tiene que haber
      // mandado uno válido (de la lista del catálogo, no cualquier texto).
      const colorOptions = product.colorOptions || [];
      let variant = '';
      if (colorOptions.length) {
        if (!colorOptions.includes(raw.variant)) {
          return res.status(400).json({ error: `Elegí un color válido para: ${product.name}` });
        }
        variant = raw.variant;
      }

      items.push({
        id: product.id,
        name: product.name + (variant ? ' - Color: ' + variant : ''),
        qty: Number(raw.qty) > 0 ? Number(raw.qty) : 1,
        price: product.price, // precio del catálogo, no el que mandó el cliente
      });
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
        email: payer.email,
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
