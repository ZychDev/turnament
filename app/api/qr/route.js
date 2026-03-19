export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return Response.json({ error: 'url query parameter is required' }, { status: 400 });
  }

  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);

  return Response.json({ qrUrl });
}
