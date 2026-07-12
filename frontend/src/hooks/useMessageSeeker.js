import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useMessageSeeker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState('');

  const messageSeeker = async (seeker) => {
    if (!user) return navigate('/login');
    if (!user.emailVerified) return navigate('/messages');
    if (seeker.userId === user.id) return navigate('/roommates/edit');
    setBusy(seeker.userId);
    try {
      const key = `roommate:${seeker.userId}`;
      const snap = await getDocs(query(collection(db, 'conversations'),
        where('listingId', '==', key), where('participants', 'array-contains', user.id)));
      let convId;
      if (!snap.empty) {
        convId = snap.docs[0].id;
      } else {
        const ref = await addDoc(collection(db, 'conversations'), {
          listingId: key,
          listingTitle: `${seeker.userName} · request`,
          participants: [user.id, seeker.userId],
          user1Id: user.id, user2Id: seeker.userId,
          user1Name: user.name, user2Name: seeker.userName,
          lastMessage: '', lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
        });
        convId = ref.id;
      }
      navigate(`/messages?conv=${convId}`);
    } catch {
      setBusy('');
    }
  };

  return { messageSeeker, busy, user };
}
