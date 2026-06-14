// api/mp-verify.js — Verifica el estado real de un pago en MercadoPago
// GET /api/mp-verify?id=PAYMENT_ID
//
// MP docs: https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const paymentId = req.query.id;
  if (!paymentId || !/^\d+$/.test(paymentId)) {
    return res.status(400).json({ error: 'payment_id inválido' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    // MP no configurado — devolvemos pending para que el flujo degrade gracefully
    return res.status(200).json({ status: 'pending_setup' });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error('MP verify error:', err);
      return res.status(502).json({ error: 'Error consultando MP' });
    }

    const payment = await mpRes.json();

    return res.status(200).json({
      status: payment.status,                         // approved | pending | rejected | cancelled
      status_detail: payment.status_detail,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      external_reference: payment.external_reference,
      payment_method: payment.payment_method_id,
      payment_type: payment.payment_type_id,
      date_approved: payment.date_approved,
    });

  } catch (err) {
    console.error('mp-verify error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
