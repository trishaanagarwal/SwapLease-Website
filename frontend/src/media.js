import { doc, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';

async function callMedia(body) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not signed in');
  const r = await fetch('/api/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`media ${r.status}`);
  return r.json();
}

// Upload one image with a server-issued signature; returns its secure_url.
export async function uploadImage(file) {
  const { cloud, ...fields } = await callMedia({ action: 'sign' });
  const fd = new FormData();
  fd.append('file', file);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}

// Best-effort cleanup: a failed media delete must never block the user's own delete.
export const destroyImages = (urls) =>
  (urls?.length ? callMedia({ action: 'destroy', urls }).catch(() => {}) : Promise.resolve());
export const purgeMyImages = () => callMedia({ action: 'purge' }).catch(() => {});

// Delete a listing together with its tombstone (rules require both), then its photos.
export async function deleteListing(listing) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'deletedListings', listing.id), {});
  batch.delete(doc(db, 'listings', listing.id));
  await batch.commit();
  await destroyImages(listing.images);
}
