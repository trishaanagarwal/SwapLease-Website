import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Avatar showing a profile photo, an initial, or a deleted-profile placeholder.
function Avatar({ name, photoURL, deleted, size = 40 }) {
  if (photoURL && !deleted) {
    return <img src={photoURL} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: deleted ? '#9ca3af' : '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
      {deleted ? '?' : (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

function fmtTime(ts) {
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(searchParams.get('conv') || null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState({}); // uid -> { name, photoURL, deleted }
  const messagesEndRef = useRef(null);

  const otherIdOf = (conv) => (conv.user1Id === user?.id ? conv.user2Id : conv.user1Id);

  // Fetch the live profile (photo + name, or deleted state) of each chat partner.
  useEffect(() => {
    if (!user) return;
    const ids = [...new Set(conversations.map(otherIdOf))].filter(Boolean);
    ids.forEach(async (id) => {
      if (profiles[id]) return;
      try {
        const snap = await getDoc(doc(db, 'users', id));
        setProfiles(p => ({ ...p, [id]: snap.exists()
          ? { name: snap.data().name, photoURL: snap.data().photoURL || '', deleted: false }
          : { name: 'Deleted profile', photoURL: '', deleted: true } }));
      } catch { /* ignore */ }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, user]);

  const profileOf = (conv) => {
    const id = otherIdOf(conv);
    const denormName = conv.user1Id === user?.id ? conv.user2Name : conv.user1Name;
    return profiles[id] || { name: denormName, photoURL: '', deleted: false };
  };

  // Real-time conversations listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q,
      snap => setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Conversations listener error:', err)
    );
    return unsub;
  }, [user]);

  // Real-time messages listener for active conversation
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    const q = query(
      collection(db, 'conversations', activeConvId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q,
      snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Messages listener error:', err)
    );
    return unsub;
  }, [activeConvId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConvId || sending) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg('');
    try {
      await addDoc(collection(db, 'conversations', activeConvId, 'messages'), {
        senderId: user.id,
        senderName: user.name,
        content,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'conversations', activeConvId), {
        lastMessage: content,
        lastMessageAt: serverTimestamp(),
      });
    } catch {
      setNewMsg(content);
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv ? profileOf(activeConv) : null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#F8F6F1', overflow: 'hidden' }}>

      <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>Messages</h1>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#9ca3af' }}><MessageSquare size={34} /></div>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>No conversations yet</p>
              <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Message a lister to get started</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = profileOf(conv);
              const isActive = conv.id === activeConvId;
              return (
                <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: isActive ? '#E8EDF6' : 'transparent', borderLeft: isActive ? '3px solid #1B3A6B' : '3px solid transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f9fafb', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={other.name} photoURL={other.photoURL} deleted={other.deleted} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.name}</span>
                        {conv.lastMessageAt && <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>{fmtTime(conv.lastMessageAt)}</span>}
                      </div>
                      {conv.listingTitle && <div style={{ fontSize: 12, color: '#1B3A6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{conv.listingTitle}</div>}
                      {conv.lastMessage && <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{conv.lastMessage}</div>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConvId && otherUser ? (
          <>
            <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={otherUser.name} photoURL={otherUser.photoURL} deleted={otherUser.deleted} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: otherUser.deleted ? '#9ca3af' : '#111', fontStyle: otherUser.deleted ? 'italic' : 'normal' }}>{otherUser.name}</div>
                {activeConv?.listingTitle && <div style={{ fontSize: 12, color: '#6b7280' }}>Re: {activeConv.listingTitle}</div>}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, margin: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><MessageSquare size={34} /></div>
                  <p>No messages yet, say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{ padding: '10px 16px', borderRadius: 18, fontSize: 14, lineHeight: 1.5, background: isMe ? '#1B3A6B' : '#fff', color: isMe ? '#fff' : '#111', borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4, boxShadow: isMe ? 'none' : '0 1px 4px rgba(0,0,0,0.08)', border: isMe ? 'none' : '1px solid #f3f4f6' }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                          {fmtTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', gap: 10 }}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 24, padding: '10px 18px', fontSize: 14, outline: 'none', color: '#111' }} />
              <button type="submit" disabled={!newMsg.trim() || sending}
                style={{ background: newMsg.trim() && !sending ? '#1B3A6B' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '50%', width: 42, height: 42, cursor: newMsg.trim() ? 'pointer' : 'not-allowed', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ↑
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><MessageSquare size={46} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Select a conversation</h3>
              <p style={{ fontSize: 14, margin: 0 }}>Choose from the list on the left to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
