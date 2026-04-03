import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../../api/message.api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Send, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import './ChatPopup.css';

export default function ChatPopup({ friend, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { fetchChatUnreadCount } = useNotification();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [videoLightbox, setVideoLightbox] = useState(null);
  const msgEnd = useRef(null);
  const friendRef = useRef(friend);
  const fileInputRef = useRef(null);

  // Keep friendRef in sync
  useEffect(() => {
    friendRef.current = friend;
  }, [friend]);

  useEffect(() => {
    if (friend?._id) loadMessages();
  }, [friend]);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listener for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMsg = (data) => {
      const msg = data.data || data;
      const f = friendRef.current;
      if (!f) return;

      if (f.isGroup) {
        if (msg.group === f._id) {
          setMessages(prev => {
            const msgId = msg._id;
            if (msgId && prev.some(m => m._id === msgId)) return prev;
            return [...prev, msg];
          });
          messageAPI.markGroupRead(f._id).then(() => fetchChatUnreadCount()).catch(() => {});
        }
      } else {
        const senderId = msg.sender?._id || msg.sender;
        const receiverId = msg.receiver?._id || msg.receiver;

        if (senderId === f._id || receiverId === f._id) {
          if (!msg.group) {
            setMessages(prev => {
              const msgId = msg._id;
              if (msgId && prev.some(m => m._id === msgId)) return prev;
              return [...prev, msg];
            });
            messageAPI.markAllRead(f._id).then(() => fetchChatUnreadCount()).catch(() => {});

          }
        }
      }
    };

    socket.on('newMessage', handleNewMsg);
    return () => socket.off('newMessage', handleNewMsg);
  }, [socket]);

  const loadMessages = async () => {
    try {
      if (friend.isGroup) {
        const res = await messageAPI.getGroupConversation(friend._id);
        setMessages(res.data || []);
        await messageAPI.markGroupRead(friend._id);
      } else {
        const res = await messageAPI.getConversation(friend._id);
        setMessages(res.data || []);
        await messageAPI.markAllRead(friend._id);
      }
      fetchChatUnreadCount();
    } catch (err) {
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      if (socket && socket.connected) {
        if (friend.isGroup) {
          socket.emit('sendGroupMessage', {
            toGroupId: friend._id,
            content: input
          });
        } else {
          socket.emit('sendMessage', {
            toUserId: friend._id,
            content: input
          });
        }
      } else {
        let res;
        if (friend.isGroup) {
          res = await messageAPI.sendGroup(friend._id, { content: input });
        } else {
          res = await messageAPI.send(friend._id, { content: input });
        }
        setMessages(prev => {
          if (res.data && res.data._id && prev.some(m => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
      setInput('');
    } catch (err) {}
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !friend) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (friend.isGroup) {
        formData.append('toGroupId', friend._id);
      } else {
        formData.append('toUserId', friend._id);
      }

      const res = await messageAPI.sendMedia(formData);
      if (res.data) {
        setMessages(prev => {
          if (res.data._id && prev.some(m => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
      toast.success('Đã gửi file!');
    } catch (err) { toast.error('Gửi file thất bại'); }
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMine = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return senderId === user?._id;
  };

  if (!friend) return null;

  return (
    <>
      {/* IMAGE LIGHTBOX */}
      {lightbox && (
        <div className="popup-lightbox" onClick={() => setLightbox(null)}>
          <div className="popup-lightbox-close" onClick={() => setLightbox(null)}>✕</div>
          <img src={lightbox} alt="Phóng to" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* VIDEO LIGHTBOX */}
      {videoLightbox && (
        <div className="popup-lightbox" onClick={() => setVideoLightbox(null)}>
          <div className="popup-lightbox-close" onClick={() => setVideoLightbox(null)}>✕</div>
          <video src={videoLightbox} controls autoPlay className="popup-lightbox-video"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="chat-popup-container">
        <div className="chat-popup-header">
          {friend.isGroup ? (
            <div className="chat-popup-avatar" style={{ background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems:'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>👥</span>
            </div>
          ) : (
            <img
              src={friend.avatarUrl || 'https://ui-avatars.com/api/?name=' + (friend.username || 'U')}
              alt="" className="chat-popup-avatar"
              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (friend.username || 'U'); }}
            />
          )}
          <span className="chat-popup-name">{friend.name || friend.fullName || friend.username}</span>
          <div className="chat-popup-close" onClick={onClose}>×</div>
        </div>

        <div className="chat-popup-body">
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 }}>
              Bắt đầu trò chuyện...
            </p>
          ) : (
            messages.map((m, i) => {
              const mine = isMine(m);
              
              // Clustering Logic
              const senderId = m.sender?._id || m.sender;
              const prevMsg = messages[i - 1];
              const nextMsg = messages[i + 1];
              const prevSenderId = prevMsg ? (prevMsg.sender?._id || prevMsg.sender) : null;
              const nextSenderId = nextMsg ? (nextMsg.sender?._id || nextMsg.sender) : null;
              
              const TIME_LIMIT = 5 * 60 * 1000; // 5 mins
              const isFirstInCluster = !prevMsg || prevSenderId !== senderId || (new Date(m.createdAt) - new Date(prevMsg.createdAt) > TIME_LIMIT);
              const isLastInCluster = !nextMsg || nextSenderId !== senderId || (new Date(nextMsg.createdAt) - new Date(m.createdAt) > TIME_LIMIT);

              return (
                <div key={m._id || i} style={{
                  display: 'flex', 
                  flexDirection: mine ? 'row-reverse' : 'row',
                  gap: 8,
                  marginBottom: isLastInCluster ? 12 : 2,
                  alignItems: 'flex-end'
                }}>
                  {/* Avatar for others in Group or Friend (Only show on last msg of cluster) */}
                  {!mine && (
                    isLastInCluster ? (
                      <img 
                        src={m.sender?.avatarUrl || friend.avatarUrl || 'https://ui-avatars.com/api/?name=U'}
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        alt=""
                      />
                    ) : (
                      <div style={{ width: 28, flexShrink: 0 }} />
                    )
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    {/* Name inside bubble area for others in Group (Only show on first msg of cluster) */}
                    {!mine && friend.isGroup && m.sender && isFirstInCluster && (
                      <span style={{ fontSize: 10, color: '#888', marginBottom: 2, marginLeft: 4 }}>
                        {m.sender.fullName || m.sender.username}
                      </span>
                    )}

                    <div className={'popup-msg ' + (mine ? 'popup-msg-right' : 'popup-msg-left')} style={{ maxWidth: '100%', margin: 0 }}>
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt="Ảnh"
                          className="popup-media"
                          onClick={() => setLightbox(m.imageUrl)}
                        />
                      )}
                      {m.videoUrl && (
                        <div className="popup-video-wrap">
                          <video src={m.videoUrl} className="popup-media"
                            onMouseEnter={(e) => e.target.play()}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                          <div className="popup-video-play">▶</div>
                          <div className="popup-video-fullscreen"
                            onClick={() => setVideoLightbox(m.videoUrl)}>⛶</div>
                        </div>
                      )}
                      {m.content && <span>{m.content}</span>}
                    </div>

                    {/* Timestamp (Only show on last msg of cluster) */}
                    {isLastInCluster && (
                      <span style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={msgEnd}></div>
        </div>

        <div className="chat-popup-input">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileSelect} />
          <button className="chat-popup-attach-btn" onClick={() => fileInputRef.current.click()} title="Đính kèm">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            placeholder="Aa..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-popup-send-btn" onClick={handleSend} disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
