// Serves /listings/:id with listing-specific Open Graph tags so shared links
// unfurl with the flat's photo, title and rent (WhatsApp, Messenger, iMessage).
// Humans get the same SPA shell; only the <head> meta differs.

const PROJECT = 'swap-lease';
const FALLBACK_IMG = 'https://swaplease.homes/og-image-v2.png';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Pull plain values out of Firestore's REST document format.
const val = (f) => f?.stringValue ?? f?.integerValue ?? f?.doubleValue ?? null;

export default async function handler(req, res) {
  const { id } = req.query;
  const host = req.headers.host || 'swaplease.homes';
  const shellUrl = `https://${host}/index.html`;

  let html;
  try {
    html = await (await fetch(shellUrl)).text();
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  try {
    const docRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/listings/${encodeURIComponent(id)}`
    );
    if (docRes.ok) {
      const doc = await docRes.json();
      const f = doc.fields || {};
      const title = val(f.title);
      if (title) {
        const rent = val(f.rent);
        const suburb = val(f.suburb);
        const desc = val(f.description) || '';
        const img = f.images?.arrayValue?.values?.[0]?.stringValue || FALLBACK_IMG;

        const ogTitle = esc(`${title} · $${rent}/wk${suburb ? ` · ${suburb}` : ''}`);
        const ogDesc = esc(desc.slice(0, 160) || `Student lease transfer in ${suburb || 'Melbourne'}. Message the lister directly on SwapLease — no agents, no fees.`);
        const ogUrl = esc(`https://swaplease.homes/listings/${id}`);
        const ogImg = esc(img);

        html = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${ogTitle} · SwapLease</title>`)
          .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${ogDesc}" />`)
          .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${ogTitle}" />`)
          .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${ogDesc}" />`)
          .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${ogUrl}" />`)
          .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${ogImg}" />`)
          .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${ogTitle}" />`)
          .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${ogDesc}" />`)
          .replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${ogImg}" />`);
      }
    }
  } catch { /* serve the untouched shell on any failure */ }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  res.statusCode = 200;
  res.end(html);
}
