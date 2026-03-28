import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { Search, Bell } from 'lucide-react';
import NotificationPanel from '../notification/NotificationPanel';
import './Navbar.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
    }
  };

  return (
    <header className="navbar">
      <form className="navbar-search" onSubmit={handleSearch}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search people, posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="navbar-actions">
        <button className="navbar-btn" onClick={() => setShowNotif(!showNotif)}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {showNotif && (
          <div className="notif-dropdown">
            <NotificationPanel onClose={() => setShowNotif(false)} />
          </div>
        )}
      </div>
    </header>
  );
}
