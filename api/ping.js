// Minimal test — works?
export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true, url: req.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
