import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, User, Users, Globe, Image, Settings, Shield } from 'lucide-react';
import './LeftSidebar.css';

export default function LeftSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';

  const links = [
    { to: '/feed', icon: <Home size={18} />, label: 'Bảng Tin Gummy' },
    { to: '/profile', icon: <User size={18} />, label: 'Hồ Sơ Của Tôi' },
    { to: '/friends', icon: <Users size={18} />, label: 'Bạn Bè' },
    { to: '/communities', icon: <Globe size={18} />, label: 'Cộng Đồng' },
    { to: '/media', icon: <Image size={18} />, label: 'Phương Tiện' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Cài Đặt' },
  ];

  if (isAdmin) {
    links.push({ to: '/admin', icon: <Shield size={18} />, label: 'Admin' });
  }

  return (
    <div className="sidebar-left-premium">
      {links.map(link => (
        <NavLink key={link.to} to={link.to}
          className={({ isActive }) => 'side-item' + (isActive ? ' active' : '')}>
          {link.icon}
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}
