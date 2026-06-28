import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function fmtTime(d) {
  try {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
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
  const messagesEndRef = useRef(null);

  const fetchConversations = () => {
    api.get('/messages/conversations').then(res => setConversations(res.data)).catch(() => {});
  };

  const fetchMessages = (convId) => {
    if (!convId) return;
    api.get(`/messages/conversations/${convId}`).then(res => setMessages(res.data)).catch(() => {});
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (activeConvId) fetchMessages(activeConvId); }, [activeConvId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConvId) fetchMessages(activeConvId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/conversations/${activeConvId}`, { content: newMsg.trim() });
      setMessages(m => [...m, res.data]);
      setNewMsg('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv
    ? (activeConv.user1Id === user?.id
        ? { name: activeConv.user2Name }
        : { name: activeConv.user1Name })
    : null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#f5f5f5', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>Messages</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>No conversations yet</p>
              <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Message a lister to get started</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.user1Id === user?.id
                ? { name: conv.user2Name }
                : { name: conv.user1Name };
              const isActive = conv.id === activeConvId;
              return (
                <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: isActive ? '#f0f9ff' : 'transparent', borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f9fafb', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {other.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.name}</span>
                        {conv.lastMessageAt && <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>{fmtTime(conv.lastMessageAt)}</span>}
                      </div>
                      {conv.listingTitle && <div style={{ fontSize: 12, color: '#0ea5e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{conv.listingTitle}</div>}
                      {conv.lastMessage && <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{conv.lastMessage}</div>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConvId && otherUser ? (
          <>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                {otherUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{otherUser.name}</div>
                {activeConv?.listingTitle && <div style={{ fontSize: 12, color: '#6b7280' }}>Re: {activeConv.listingTitle}</div>}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, margin: 'auto' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
                  <p>No messages yet — say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{
                          padding: '10px 16px', borderRadius: 18, fontSize: 14, lineHeight: 1.5,
                          background: isMe ? '#0ea5e9' : '#fff',
                          color: isMe ? '#fff' : '#111',
                          borderBottomRightRadius: isMe ? 4 : 18,
                          borderBottomLeftRadius: isMe ? 18 : 4,
                          boxShadow: isMe ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
                          border: isMe ? 'none' : '1px solid #f3f4f6',
                        }}>
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

            {/* Input */}
            <form onSubmit={sendMessage} style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', gap: 10 }}>
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 24, padding: '10px 18px', fontSize: 14, outline: 'none', color: '#111' }}
              />
              <button type="submit" disabled={!newMsg.trim() || sending}
                style={{ background: newMsg.trim() && !sending ? '#0ea5e9' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '50%', width: 42, height: 42, cursor: newMsg.trim() ? 'pointer' : 'not-allowed', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ↑
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Select a conversation</h3>
              <p style={{ fontSize: 14, margin: 0 }}>Choose from the list on the left to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
