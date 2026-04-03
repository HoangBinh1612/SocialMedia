import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { friendAPI } from '../api/friend.api';
import { messageAPI } from '../api/message.api';
import { groupAPI } from '../api/group.api';
import toast from 'react-hot-toast';
import { Paperclip, Send, MessageSquare, Users, Plus, MoreVertical, LogOut, Trash2, UserPlus } from 'lucide-react';
import './ChatPage.css';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { fetchChatUnreadCount, unreadFriendIds, unreadGroupIds } = useNotification();
  const [contacts, setContacts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [videoLightbox, setVideoLightbox] = useState(null);
  
  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');

  // Group Management States
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [addSelectedFriends, setAddSelectedFriends] = useState([]);

  const msgEnd = useRef(null);
  const fileInput = useRef(null);
  const selectedRef = useRef(null);

  // Keep selectedRef in sync
  useEffect(() => {
    selectedRef.current = selected;
    setShowGroupMenu(false);
  }, [selected]);

  useEffect(() => {
    const init = async () => {
      let loadedContacts = [];
      try {
        const resF = await friendAPI.getList();
        const fList = (resF.data || []).map(f => f.friend || f);
        setFriends(fList);
        loadedContacts = [...fList]; // start with friends
      } catch (err) {}

      try {
        const resG = await groupAPI.getMyGroups();
        const gList = (resG.data || []).map(g => ({ ...g, isGroup: true }));
        // Add groups to contacts
        loadedContacts = [...gList, ...loadedContacts];
      } catch (err) {}

      setContacts(loadedContacts);
      setLoading(false);

      try {
        const res = await messageAPI.recent();
        if (res.data && res.data.length > 0) {
          // Check if it's already in loadedContacts
          const recentUser = res.data[0].user;
          const matched = loadedContacts.find(c => c._id === recentUser._id);
          setSelected(matched || recentUser);
        } else if (loadedContacts.length > 0) {
          setSelected(loadedContacts[0]);
        }
      } catch (err) {}
    };
    init();
  }, []);

  useEffect(() => {
    if (selected) {
      loadConversation();
    }
  }, [selected]);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;

    const handleNewMsg = (data) => {
      const msg = data.data || data;
      const sel = selectedRef.current;
      if (!sel) return;

      if (sel.isGroup) {
        if (msg.group === sel._id) {
          setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          messageAPI.markGroupRead(sel._id).then(() => fetchChatUnreadCount()).catch(() => {});
        }
      } else {
        const senderId = msg.sender?._id || msg.sender;
        const receiverId = msg.receiver?._id || msg.receiver;
        if (senderId === sel._id || receiverId === sel._id) {
          if (!msg.group) { // Ensure it's not a group message leaking
            setMessages(prev => {
              if (prev.some(m => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
            messageAPI.markAllRead(sel._id).then(() => fetchChatUnreadCount()).catch(() => {});
          }
        }
      }
    };

    socket.on('newMessage', handleNewMsg);
    
    // Group events
    const handleNewGroup = (group) => {
      setContacts(prev => [{...group, isGroup: true}, ...prev]);
    };
    const handleGroupDeleted = (groupId) => {
      setContacts(prev => prev.filter(c => c._id !== groupId));
      if (selectedRef.current && selectedRef.current._id === groupId) {
        setSelected(null);
        setMessages([]);
      }
    };

    socket.on('newGroup', handleNewGroup);
    socket.on('groupDeleted', handleGroupDeleted);

    return () => {
      socket.off('newMessage', handleNewMsg);
      socket.off('newGroup', handleNewGroup);
      socket.off('groupDeleted', handleGroupDeleted);
    };
  }, [socket]);

  const loadConversation = async () => {
    try {
      if (selected.isGroup) {
        const res = await messageAPI.getGroupConversation(selected._id);
        setMessages(res.data || []);
        await messageAPI.markGroupRead(selected._id);
      } else {
        const res = await messageAPI.getConversation(selected._id);
        setMessages(res.data || []);
        await messageAPI.markAllRead(selected._id);
      }
      fetchChatUnreadCount();
    } catch (err) { setMessages([]); }
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !selected) return;
    try {
      if (socket && socket.connected) {
        if (selected.isGroup) {
          socket.emit('sendGroupMessage', { toGroupId: selected._id, content: newMsg });
        } else {
          socket.emit('sendMessage', { toUserId: selected._id, content: newMsg });
        }
      } else {
        // Fallback
        let res;
        if (selected.isGroup) {
          res = await messageAPI.sendGroup(selected._id, { content: newMsg });
        } else {
          res = await messageAPI.send(selected._id, { content: newMsg });
        }
        setMessages(prev => {
          if (prev.some(m => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
      setNewMsg('');
    } catch (err) { toast.error('Gửi tin nhắn thất bại'); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selected.isGroup) {
        formData.append('toGroupId', selected._id);
      } else {
        formData.append('toUserId', selected._id);
      }
      const res = await messageAPI.sendMedia(formData);
      if (res.data) {
        setMessages(prev => {
          if (prev.some(m => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
      toast.success('Đã gửi file!');
    } catch (err) { toast.error('Gửi file thất bại'); }
    e.target.value = '';
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error('Vui lòng nhập tên nhóm');
    if (selectedFriends.length === 0) return toast.error('Hãy chọn ít nhất 1 thành viên');
    try {
      const res = await groupAPI.createGroup({ name: groupName, members: selectedFriends });
      toast.success('Tạo nhóm thành công!');
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedFriends([]);
      // Contacts will update via socket 'newGroup' OR we append manually
      const newGroup = { ...res.data, isGroup: true };
      setContacts(prev => [newGroup, ...prev.filter(c => c._id !== newGroup._id)]);
      setSelected(newGroup);
    } catch (err) { toast.error('Tạo nhóm thất bại'); }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn rời nhóm này?")) return;
    try {
      await groupAPI.leaveGroup(selected._id);
      toast.success('Đã rời nhóm');
      setContacts(prev => prev.filter(c => c._id !== selected._id));
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi rời nhóm'); }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn XÓA nhóm này? Toàn bộ tin nhắn sẽ bị xóa.")) return;
    try {
      await groupAPI.deleteGroup(selected._id);
      toast.success('Nhóm đã bị xóa');
      setContacts(prev => prev.filter(c => c._id !== selected._id));
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi xóa nhóm'); }
  };

  const handleAddMembers = async () => {
    if (addSelectedFriends.length === 0) return toast.error('Hãy chọn người để thêm');
    try {
      const res = await groupAPI.addMembers(selected._id, addSelectedFriends);
      toast.success('Đã thêm thành viên');
      const updatedGroup = { ...res.data, isGroup: true };
      setSelected(updatedGroup);
      setContacts(prev => prev.map(c => c._id === updatedGroup._id ? updatedGroup : c));
      setShowAddMembersModal(false);
      setAddSelectedFriends([]);
      setShowGroupMenu(false);
    } catch(err) { toast.error("Lỗi thêm thành viên"); }
  };

  const isMine = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return senderId === user?._id;
  };

  const getSenderName = (msg) => {
    if (isMine(msg)) return 'Bạn';
    return msg.sender?.fullName || msg.sender?.username || '';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>;

  return (
    <div className="chat-page-old">
      {/* LIGHTBOXES */}
      {lightbox && (
        <div className="chat-lightbox" onClick={() => setLightbox(null)}>
          <div className="chat-lightbox-close" onClick={() => setLightbox(null)}>✕</div>
          <img src={lightbox} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {videoLightbox && (
        <div className="chat-lightbox" onClick={() => setVideoLightbox(null)}>
          <div className="chat-lightbox-close" onClick={() => setVideoLightbox(null)}>✕</div>
          <video src={videoLightbox} controls autoPlay className="chat-lightbox-video" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div className="chat-modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            <h3>Tạo Nhóm Mới</h3>
            <input 
              className="chat-modal-input"
              placeholder="Tên nhóm chat..." 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
            />
            <div style={{ maxHeight: 200, overflowY: 'auto', margin: '15px 0' }}>
              {friends.length === 0 ? <p style={{fontSize: 13, color: '#888'}}>Không có bạn bè nào để thêm</p> : 
               friends.map(f => (
                <label key={f._id} className="chat-modal-friend-item">
                  <input 
                    type="checkbox" 
                    className="chat-modal-checkbox"
                    checked={selectedFriends.includes(f._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedFriends(p => [...p, f._id]);
                      else setSelectedFriends(p => p.filter(id => id !== f._id));
                    }}
                  />
                  <img src={f.avatarUrl || 'https://ui-avatars.com/api/?name=' + (f.username||'U')} style={{width:36,height:36,borderRadius:'50%', objectFit: 'cover'}} />
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{f.fullName || f.username}</div>
                </label>
              ))}
            </div>
            <div className="chat-modal-actions">
              <button className="chat-modal-cancel" onClick={() => setShowCreateGroup(false)}>Hủy</button>
              <button className="chat-modal-submit" onClick={handleCreateGroup}>Tạo nhóm</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="chat-sidebar">
        <div className="chat-tabs">
          <button className={'chat-tab ' + (activeTab === 'personal' ? 'active' : '')} onClick={() => setActiveTab('personal')}>
            Cá nhân
          </button>
          <button className={'chat-tab ' + (activeTab === 'group' ? 'active' : '')} onClick={() => setActiveTab('group')}>
            Nhóm Chat
          </button>
        </div>

        {activeTab === 'group' && (
          <div style={{ padding: '10px 18px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
             <button className="chat-create-group-btn" onClick={() => setShowCreateGroup(true)} style={{ margin: 0, width: '100%' }}>
               + CÙNG TẠO NHÓM MỚI
             </button>
          </div>
        )}
        
        {contacts.filter(c => activeTab === 'group' ? c.isGroup : !c.isGroup).length === 0 ? (
          <p className="chat-empty">Chưa có liên hệ nào</p>
        ) : (
          contacts.filter(c => activeTab === 'group' ? c.isGroup : !c.isGroup).map(c => {
            const isUnread = c.isGroup 
              ? (unreadGroupIds && unreadGroupIds.includes(c._id))
              : (unreadFriendIds && unreadFriendIds.includes(c._id));

            return (
              <div key={c._id}
                className={'chat-contact' + (selected?._id === c._id ? ' active' : '') + (isUnread ? ' unread-item' : '')}
                onClick={() => setSelected(c)}>
                
                {c.isGroup ? (
                  <div className="chat-group-icon"><Users size={22} color="#1c523d" /></div>
                ) : (
                  <img src={c.avatarUrl || 'https://ui-avatars.com/api/?name=' + (c.username || 'U')}
                  alt="" className="chat-avatar"
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (c.username || 'U'); }} />
                )}
                
                <div className="chat-contact-name">{c.name || c.fullName || c.username}</div>
                {isUnread && <div className="unread-dot"></div>}
              </div>
            );
          })
        )}
      </div>

      {/* MAIN AREA */}
      <div className="chat-main">
        {!selected ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon"><MessageSquare size={48} color="#ccc" /></div>
            Chọn liên hệ hoặc nhóm để bắt đầu
          </div>
        ) : (
          <>
            <div className="chat-header">
              {selected.isGroup ? (
                <div className="chat-group-icon" style={{width: 45, height: 45, flexShrink: 0}}><Users size={22} color="#1c523d" /></div>
              ) : (
                <img src={selected.avatarUrl || 'https://ui-avatars.com/api/?name=' + (selected.username || 'G')}
                alt="" style={{width: 45, height: 45, borderRadius: '50%', flexShrink:0}}
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (selected.username || 'G'); }} />
              )}
              <div className="chat-header-info" style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: 18 }}>{selected.name || selected.fullName || selected.username}</h3>
                {selected.isGroup && <div style={{fontSize: 12, color: '#666', marginTop: 2}}>{selected.members?.length} thành viên</div>}
              </div>

              {selected.isGroup && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowGroupMenu(!showGroupMenu)} className="chat-header-actionbtn" title="Tùy chọn">
                    <MoreVertical size={20} />
                  </button>

                  {showGroupMenu && (
                    <div className="chat-group-dropdown">
                      <div className="cgd-item" onClick={() => { setShowMembersModal(true); setShowGroupMenu(false); }}>
                        <Users size={16} /> Xem thành viên
                      </div>
                      {(selected.creator?._id === user?._id || selected.creator === user?._id) ? (
                        <>
                          <div className="cgd-item" onClick={() => { setShowAddMembersModal(true); setShowGroupMenu(false); }}>
                            <UserPlus size={16} /> Thêm thành viên
                          </div>
                          <div className="cgd-item delete" onClick={() => { handleDeleteGroup(); setShowGroupMenu(false); }}>
                            <Trash2 size={16} /> Xóa nhóm
                          </div>
                        </>
                      ) : (
                        <div className="cgd-item leave" onClick={() => { handleLeaveGroup(); setShowGroupMenu(false); }}>
                          <LogOut size={16} /> Rời nhóm
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MODAL: VIEW MEMBERS */}
            {showMembersModal && (
              <div className="chat-modal-overlay" onClick={() => setShowMembersModal(false)}>
                <div className="chat-modal" onClick={e => e.stopPropagation()}>
                  <h3>Thành viên nhóm ({selected.members?.length})</h3>
                  <div style={{ maxHeight: 300, overflowY: 'auto', margin: '15px 0' }}>
                    {selected.members?.map(m => (
                      <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eee' }}>
                        <img src={m.avatarUrl || 'https://ui-avatars.com/api/?name=' + (m.username || 'U')} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ fontWeight: 500 }}>
                          {m.fullName || m.username} 
                          {(selected.creator?._id === m._id || selected.creator === m._id) && <span style={{fontSize: 11, background: '#E88DB5', color: 'white', padding: '2px 6px', borderRadius: 10, marginLeft: 8}}>Quản trị viên</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="chat-modal-actions">
                    <button className="chat-modal-cancel" onClick={() => setShowMembersModal(false)} style={{flex: 1}}>Đóng</button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: ADD MEMBERS */}
            {showAddMembersModal && (
              <div className="chat-modal-overlay" onClick={() => setShowAddMembersModal(false)}>
                <div className="chat-modal" onClick={e => e.stopPropagation()}>
                  <h3>Thêm thành viên</h3>
                  <div style={{ maxHeight: 250, overflowY: 'auto', margin: '15px 0' }}>
                    {friends.filter(f => !selected.members?.some(m => m._id === f._id)).length === 0 ? (
                      <p style={{fontSize: 13, color: '#888'}}>Không có bạn bè nào mới để thêm</p>
                    ) : (
                      friends.filter(f => !selected.members?.some(m => m._id === f._id)).map(f => (
                        <label key={f._id} className="chat-modal-friend-item">
                          <input 
                            type="checkbox" 
                            className="chat-modal-checkbox"
                            checked={addSelectedFriends.includes(f._id)}
                            onChange={(e) => {
                              if (e.target.checked) setAddSelectedFriends(p => [...p, f._id]);
                              else setAddSelectedFriends(p => p.filter(id => id !== f._id));
                            }}
                          />
                          <img src={f.avatarUrl || 'https://ui-avatars.com/api/?name=' + (f.username||'U')} style={{width:36,height:36,borderRadius:'50%', objectFit: 'cover'}} />
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{f.fullName || f.username}</div>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="chat-modal-actions">
                    <button className="chat-modal-cancel" onClick={() => setShowAddMembersModal(false)}>Hủy</button>
                    <button className="chat-modal-submit" onClick={handleAddMembers}>Thêm vào nhóm</button>
                  </div>
                </div>
              </div>
            )}

            <div className="chat-body-area">
              {messages.length === 0 ? (
                <div className="chat-empty-sub">Hãy gửi lời chào!</div>
              ) : (
                 // rendering logic
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
                    <div key={m._id || i} className={'chat-msg-row ' + (mine ? 'mine' : 'theirs')} style={{ marginBottom: isLastInCluster ? 12 : 2 }}>
                      {/* Avatar Placeholder for alignment */}
                      {!mine && (
                        isLastInCluster ? (
                           <img src={m.sender?.avatarUrl || 'https://ui-avatars.com/api/?name=U'}
                              alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginRight: 8, marginTop: 'auto' }} title={getSenderName(m)}
                              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=U'; }} />
                        ) : (
                           <div style={{ width: 32, marginRight: 8, flexShrink: 0 }} />
                        )
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                        {/* Name on top of cluster */}
                        {!mine && selected.isGroup && isFirstInCluster && (
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 2, marginLeft: 2 }}>{getSenderName(m)}</div>
                        )}

                        <div className={'chat-bubble ' + (mine ? 'mine' : 'theirs')} style={{ maxWidth: '100%' }}>
                          {m.content && <div className="chat-msg-text">{m.content}</div>}
                          
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="attachment" className="chat-img clickable"
                                onClick={() => setLightbox(m.imageUrl)} />
                          )}
                          {m.videoUrl && (
                            <div className="chat-video-wrap" onClick={() => setVideoLightbox(m.videoUrl)}>
                               <video src={m.videoUrl} className="chat-video" />
                               <div className="chat-video-play">▶</div>
                            </div>
                          )}
                        </div>

                        {/* Timestamp at bottom of cluster */}
                        {isLastInCluster && (
                           <div className="chat-msg-time" style={{ textAlign: mine ? 'right' : 'left' }}>
                             {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={msgEnd} />
            </div>

            <div className="chat-input-area">
              <input type="file" ref={fileInput} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileSelect} />
              <button className="chat-attach-btn" onClick={() => fileInput.current.click()} title="Gửi Ảnh/Video">
                <Paperclip size={20} />
              </button>
              
              <textarea
                className="chat-textarea"
                placeholder="Nhập tin nhắn..."
                value={newMsg}
                rows={1}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button className="chat-send-btn" onClick={handleSend} disabled={!newMsg.trim()}>
                <Send size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
