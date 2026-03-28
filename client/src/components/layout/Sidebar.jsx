import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, MessageCircle, Users, User, Settings, Shield, LogOut, Compass } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.name === 'ADMIN';

  const links = [
    { to: '/feed', icon: <Home size={20} />, label: 'Feed' },
    { to: '/chat', icon: <MessageCircle size={20} />, label: 'Messages' },
    { to: '/friends', icon: <Users size={20} />, label: 'Friends' },
    { to: '/communities', icon: <Compass size={20} />, label: 'Communities' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  if (isAdmin) {
    links.push({ to: '/admin', icon: <Shield size={20} />, label: 'Admin' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🌐</span>
          <span className="sidebar-logo-text">Gummy</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink key={link.to} to={link.to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <img
            src={user?.avatarUrl || '/images/default-avatar.png'}
            alt=""
            className="avatar avatar-md"
            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (user?.username || 'U'); }}
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.fullName || user?.username}</span>
            <span className="sidebar-user-role">{user?.role?.name || 'USER'}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
