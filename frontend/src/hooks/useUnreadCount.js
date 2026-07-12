import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useUnreadCount(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
    const unsub = onSnapshot(q, snap => {
      const unread = snap.docs.filter(d => {
        const data = d.data();
        // Only count as unread if someone else sent the last message and we haven't seen it.
        return data.lastSenderId && data.lastSenderId !== userId && !data.readBy?.includes(userId);
      }).length;
      setCount(unread);
    }, () => {});
    return unsub;
  }, [userId]);

  return count;
}
