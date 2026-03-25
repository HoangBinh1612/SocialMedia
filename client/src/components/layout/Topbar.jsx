import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Search, Bell, MessageCircle } from 'lucide-react';
import NotificationPanel from '../notification/NotificationPanel';
import './Topbar.css';

export default function Topbar() {
  const { user } = useAuth();
  const { unreadCount, chatUnreadCount } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
    }
  };

  return (
    <div className="topbar-premium">
      <Link to="/feed" className="logo">Gummy</Link>

      <form onSubmit={handleSearch} style={{ flex: 1 }}>
        <input
          type="text"
          className="search-premium"
          placeholder="Tìm Kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="top-icons">
        <div className="notification-wrapper" onClick={() => setShowNotif(!showNotif)}>
          <Bell size={22} className="top-icon-btn" />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
          {showNotif && (
            <div className="notification-dropdown-wrap">
              <NotificationPanel onClose={() => setShowNotif(false)} />
            </div>
          )}
        </div>

        <Link to="/chat" title="Tin Nhắn" style={{ position: 'relative' }}>
          <MessageCircle size={22} className="top-icon-btn" />
          {chatUnreadCount > 0 && (
            <span className="notification-badge" style={{ background: '#ff4d4f', right: -6, top: -4 }}>
              {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
            </span>
          )}
        </Link>

        <Link to="/profile" title="Hồ Sơ">
          <img
            src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (user?.username || 'U')}
            alt="" className="avatar-small-img"
            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + user?.username; }}
          />
        </Link>
      </div>
    </div>
  );
}
