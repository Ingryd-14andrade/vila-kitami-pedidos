import { list, get } from '@vercel/blob';

// Lista os pedidos para o painel da loja. Exige o PIN da dona (variável ADMIN_PIN).
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const pin = String(req.headers['x-pin'] || '');
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ ok: false });
  const desde = Number(req.query.desde) || (Date.now() - 36 * 3600 * 1000);
  const { blobs } = await list({ prefix: 'pedidos/', limit: 1000 });
  const novos = blobs
    .filter(x => new Date(x.uploadedAt).getTime() > desde)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 60);
  const pedidos = await Promise.all(novos.map(async x => {
    try {
      const r = await get(x.pathname, { access: 'private', useCache: false });
      if (!r || r.statusCode !== 200) return null;
      return JSON.parse(await new Response(r.stream).text());
    } catch (e) { return null; }
  }));
  return res.status(200).json({ ok: true, agora: Date.now(), pedidos: pedidos.filter(Boolean) });
}
