import { useState, useEffect } from 'react';
import { friendAPI } from '../../api/friend.api';
import { groupAPI } from '../../api/group.api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import ChatPopup from '../chat/ChatPopup';
import { Users } from 'lucide-react';
import './RightSidebar.css';

export default function RightSidebar() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { unreadFriendIds, unreadGroupIds } = useNotification();
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chatFriend, setChatFriend] = useState(null);

  useEffect(() => {
    friendAPI.getList()
      .then(res => {
        const list = res.data || [];
        const normalized = list.map(f => f.friend || f);
        setFriends(normalized);
      })
      .catch(() => {});

    groupAPI.getMyGroups()
      .then(res => {
         const list = res.data || [];
         const normalizedGroups = list.map(g => ({ ...g, isGroup: true }));
         setGroups(normalizedGroups);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (event) => {
      let msg = event.data;
      if (!msg) return;
      
      let isForGroup = msg.group !== null && msg.group !== undefined;
      
      setChatFriend((prevChatFriend) => {
          if (prevChatFriend !== null) {
              return prevChatFriend; // Đang nhắn tin với người khác thì không cướp màn hình
          }
          
          if (isForGroup) {
              let gId = msg.group._id || msg.group;
              let foundGroup = groups.find(g => g._id === gId);
              if (foundGroup) return foundGroup;
          } else {
              const otherUserId = msg.sender._id === user?._id ? msg.receiver._id : msg.sender._id;
              let foundFriend = friends.find(f => f._id === otherUserId);
              if (foundFriend) return foundFriend;
          }
          return prevChatFriend;
      });
    };
    
    socket.on('newMessage', handleNewMessage);
    
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, friends, groups, user?._id]);

  const handleOpenChat = (item) => {
    setChatFriend(item);
  };

  return (
    <div className="sidebar-right-premium">
      <div className="card-premium">
        <h3 className="card-title">Nhóm chat</h3>
        {groups.length === 0 ? (
          <p style={{ color: '#999', fontSize: 13 }}>Chưa tham gia nhóm nào</p>
        ) : (
          groups.map(g => {
            const isUnread = unreadGroupIds && unreadGroupIds.includes(g._id);
            return (
              <div key={g._id} className={`active-user-item ${isUnread ? 'unread-item' : ''}`} onClick={() => handleOpenChat(g)}
                style={{ cursor: 'pointer' }}>
                <div className="active-avatar-wrap" style={{ background: '#B7EBD6', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#1c523d" />
                </div>
                <span className="active-name">{g.name || 'Nhóm'}</span>
                {isUnread && <span className="unread-dot"></span>}
              </div>
            );
          })
        )}
      </div>

      <div className="card-premium">
        <h3 className="card-title">Người liên hệ</h3>
        {friends.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14 }}>Chưa có người liên hệ</p>
        ) : (
          friends.map(f => {
            const isUnread = unreadFriendIds && unreadFriendIds.includes(f._id);
            return (
              <div key={f._id} className={`active-user-item ${isUnread ? 'unread-item' : ''}`} onClick={() => handleOpenChat(f)}
                style={{ cursor: 'pointer' }}>
                <div className="active-avatar-wrap">
                  <img
                    src={f.avatarUrl || 'https://ui-avatars.com/api/?name=' + (f.username || 'U')}
                    alt=""
                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (f.username || 'U'); }}
                  />
                  {!isUnread && <span className="online-dot"></span>}
                </div>
                <span className="active-name">{f.fullName || f.username}</span>
                {isUnread && <span className="unread-dot"></span>}
              </div>
            );
          })
        )}
      </div>

      {/* Chat Popup */}
      {chatFriend && (
        <ChatPopup friend={chatFriend} onClose={() => setChatFriend(null)} />
      )}
    </div>
  );
}
