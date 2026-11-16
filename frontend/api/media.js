// Signed Cloudinary uploads and deletes, bound to the caller's Firebase identity.
// Every upload lands under u/<uid>/, and a caller can only delete inside their own folder.
// Needs Vercel env vars: CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (and VITE_FIREBASE_API_KEY).
import crypto from 'node:crypto';

const CLOUD = 'deewvfzpl';
const FORMATS = 'jpg,jpeg,png,webp,gif,heic,heif,avif';

// Cloudinary signature: sorted "k=v&k=v" + secret, SHA-1 hex.
export const sign = (params, secret) =>
  crypto.createHash('sha1')
    .update(Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + secret)
    .digest('hex');

// https://res.cloudinary.com/<cloud>/image/upload/[transforms/]v123/u/abc/x.jpg -> u/abc/x
export const publicIdOf = (url) => {
  const m = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:.*?\/)?v\d+\/(.+)\.[a-z0-9]+$/i.exec(url || '');
  return m ? m[1] : null;
};

// Firebase validates the ID token server-side; an invalid or expired token yields no user.
async function uidFrom(req) {
  const idToken = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!idToken) return null;
  const key = (process.env.VITE_FIREBASE_API_KEY || '').trim();
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return null;
  return (await r.json()).users?.[0]?.localId || null;
}

export default async function handler(req, res) {
  const send = (code, body) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') return send(405, { error: 'POST only' });

  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!key || !secret) return send(500, { error: 'Media not configured' });

  const uid = await uidFrom(req).catch(() => null);
  if (!uid) return send(401, { error: 'Sign in required' });

  const folder = `u/${uid}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const body = req.body || {};

  if (body.action === 'sign') {
    const params = { allowed_formats: FORMATS, folder, timestamp };
    return send(200, { cloud: CLOUD, api_key: key, ...params, signature: sign(params, secret) });
  }

  if (body.action === 'destroy') {
    const ids = (Array.isArray(body.urls) ? body.urls : []).slice(0, 20)
      .map(publicIdOf)
      .filter(id => id && id.startsWith(`${folder}/`));
    await Promise.all(ids.map(public_id => {
      const p = { public_id, timestamp };
      return fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
        method: 'POST',
        body: new URLSearchParams({ ...p, api_key: key, signature: sign(p, secret) }),
      });
    }));
    return send(200, { destroyed: ids.length });
  }

  // Account deletion: remove everything the user ever uploaded.
  if (body.action === 'purge') {
    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/resources/image/upload?prefix=${encodeURIComponent(`${folder}/`)}`,
      { method: 'DELETE', headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` } },
    );
    return send(r.ok ? 200 : 502, {});
  }

  return send(400, { error: 'Unknown action' });
}
