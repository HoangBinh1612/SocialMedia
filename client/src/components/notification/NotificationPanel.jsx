import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationPanel.css';

export default function NotificationPanel({ onClose }) {
  const { notifications, markAsRead } = useNotification();
  const navigate = useNavigate();

  const handleClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    // Navigate based on type
    const t = notif.type;
    if (t === 'FRIEND_REQUEST' || t === 'FRIEND_ACCEPT') {
      navigate('/friends');
    } else if (t === 'REACTION' || t === 'LIKE' || t === 'COMMENT') {
      navigate('/feed');
    } else if (t === 'MESSAGE') {
      navigate('/chat');
    }
    onClose && onClose();
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return mins + ' phút trước';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + ' giờ trước';
    return Math.floor(hrs / 24) + ' ngày trước';
  };

  return (
    <div className="notification-panel">
      <div className="notif-header">
        <h3>Thông báo</h3>
      </div>
      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div style={{ fontSize: 48, marginBottom: 10 }}>🔔</div>
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n._id}
              className={'notif-item' + (n.isRead ? '' : ' unread')}
              onClick={() => handleClick(n)}>
              <img src={n.actor?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (n.actor?.username || 'U')}
                alt="" className="notif-avatar"
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + n.actor?.username; }} />
              <div className="notif-content">
                <div className="notif-message">
                  <strong>{n.actor?.fullName || n.actor?.username || 'Người dùng'}</strong> {n.message}
                </div>
                <div className="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
