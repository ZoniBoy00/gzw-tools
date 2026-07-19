// Minimal test — Express-style (req, res)
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, url: req.url, method: req.method });
}
