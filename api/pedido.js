import { put } from '@vercel/blob';

// Recebe o pedido do cliente e guarda no armazenamento privado da loja.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { return res.status(400).json({ ok: false }); } }
  const p = b && b.pedido;
  if (!p || !Array.isArray(p.i) || !p.i.length) return res.status(400).json({ ok: false });
  const corpo = JSON.stringify(p);
  if (corpo.length > 20000) return res.status(413).json({ ok: false });
  const id = String(b.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60) || Date.now().toString(36);
  await put(`pedidos/${id}.json`, JSON.stringify({ id, recebido: Date.now(), pedido: p }), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true
  });
  return res.status(200).json({ ok: true, id });
}
