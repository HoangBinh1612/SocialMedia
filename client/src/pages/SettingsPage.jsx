import { useState, useEffect } from 'react';
import { profileAPI } from '../api/profile.api';
import { settingsAPI } from '../api/settings.api';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  
  const [showPwBox, setShowPwBox] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [privacy, setPrivacy] = useState({ privacyPosts: 'PUBLIC', privacyFriendRequests: 'EVERYONE', privacyFriendList: 'PUBLIC' });

  useEffect(() => {
    profileAPI.getMe().then(res => setProfile(res.data)).catch(() => {});
    settingsAPI.getPrivacy().then(res => setPrivacy(res.data)).catch(() => {});
  }, []);

  const handleStartEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = async () => {
    let val = editValue;
    if (typeof val === 'string') val = val.trim();

    if (editingField === 'fullName') {
      if (!val || val.length < 2 || val.length > 50) return toast.error('Tên hiển thị phải từ 2-50 ký tự');
    }
    
    if (editingField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val || !emailRegex.test(val)) return toast.error('Email không hợp lệ');
    }
    
    if (editingField === 'phone') {
      const phoneRegex = /^0\d{9}$/;
      if (val && !phoneRegex.test(val)) return toast.error('Số điện thoại không hợp lệ (Bắt đầu bằng 0 và có 10 số)');
    }

    try {
      const update = { [editingField]: val };
      await profileAPI.updateMe(update);
      setProfile(prev => ({ ...prev, ...update }));
      toast.success('Cập nhật thành công!');
      setEditingField(null);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Cập nhật thất bại'); 
    }
  };

  const handleChangePw = async () => {
    if (!currentPw || !newPw) return toast.error('Vui lòng điền đầy đủ');
    if (currentPw === newPw) return toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
    if (newPw.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    
    try {
      await profileAPI.changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success('Đã đổi mật khẩu thành công!');
      setShowPwBox(false); setCurrentPw(''); setNewPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại'); }
  };

  const renderField = (fieldKey, label, currentValue) => {
    const isEditing = editingField === fieldKey;
    return (
      <div className="setting-row">
        <span className="label">{label}</span>
        <div>
          {isEditing ? (
            <div className="inline-edit-form">
              <input 
                className="inline-edit-input" 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                autoFocus 
              />
              <button className="btn-icon confirm" onClick={handleSaveEdit} title="Lưu">
                <Check size={18} />
              </button>
              <button className="btn-icon cancel" onClick={() => setEditingField(null)} title="Huỷ">
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <span style={{ marginRight: '10px' }}>{currentValue || '—'}</span>
              <button className="btn-edit" onClick={() => handleStartEdit(fieldKey, currentValue)}>Chỉnh Sửa</button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="settings-page-old">
      {/* GENERAL ACCOUNT */}
      <div className="settings-card">
        <div className="section-title">Cài Đặt Tài Khoản Chung</div>
        
        {renderField('fullName', 'Tên Hiển Thị', profile?.fullName)}
        
        <div className="setting-row">
          <span className="label">Tên Đăng Nhập</span>
          <div style={{ color: '#888', fontWeight: '500' }}>@{profile?.username || user?.username}</div>
        </div>
        
        {renderField('email', 'Email', profile?.email)}
        {renderField('phone', 'Số Điện Thoại', profile?.phone)}

        <div className="setting-row">
          <span className="label">Mật Khẩu</span>
          <div>
            <span style={{ marginRight: '10px', letterSpacing: '2px' }}>●●●●●●●</span>
            <button className="btn-edit" onClick={() => setShowPwBox(!showPwBox)}>Thay Đổi</button>
          </div>
        </div>
        {showPwBox && (
          <div className="change-pw-box">
            <input type="password" placeholder="Mật khẩu hiện tại" value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)} />
            <input type="password" placeholder="Mật khẩu mới" value={newPw}
              onChange={(e) => setNewPw(e.target.value)} />
            <button className="btn-edit" onClick={handleChangePw}>Lưu</button>
            <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => setShowPwBox(false)}>Huỷ</button>
          </div>
        )}
      </div>

      {/* PRIVACY */}
      <div className="settings-card">
        <div className="section-title">Quyền Riêng Tư</div>
        <div className="setting-row">
          <span className="label">Ai có thể xem bài viết</span>
          <select className="btn-small" value={privacy.privacyPosts}
            onChange={async (e) => {
              const val = e.target.value;
              setPrivacy(prev => ({ ...prev, privacyPosts: val }));
              try { await settingsAPI.updatePrivacy({ privacyPosts: val }); toast.success('Đã cập nhật'); } catch { toast.error('Lỗi'); }
            }}>
            <option value="PUBLIC">Công khai</option>
            <option value="FRIENDS">Bạn bè</option>
            <option value="ONLY_ME">Chỉ mình tôi</option>
          </select>
        </div>
        <div className="setting-row">
          <span className="label">Ai có thể gửi lời mời kết bạn</span>
          <select className="btn-small" value={privacy.privacyFriendRequests}
            onChange={async (e) => {
              const val = e.target.value;
              setPrivacy(prev => ({ ...prev, privacyFriendRequests: val }));
              try { await settingsAPI.updatePrivacy({ privacyFriendRequests: val }); toast.success('Đã cập nhật'); } catch { toast.error('Lỗi'); }
            }}>
            <option value="EVERYONE">Mọi người</option>
            <option value="FRIENDS_OF_FRIENDS">Bạn của bạn</option>
            <option value="NOBODY">Không ai</option>
          </select>
        </div>
        <div className="setting-row">
          <span className="label">Ai có thể xem danh sách bạn bè</span>
          <select className="btn-small" value={privacy.privacyFriendList}
            onChange={async (e) => {
              const val = e.target.value;
              setPrivacy(prev => ({ ...prev, privacyFriendList: val }));
              try { await settingsAPI.updatePrivacy({ privacyFriendList: val }); toast.success('Đã cập nhật'); } catch { toast.error('Lỗi'); }
            }}>
            <option value="PUBLIC">Công khai</option>
            <option value="FRIENDS">Bạn bè</option>
            <option value="ONLY_ME">Chỉ mình tôi</option>
          </select>
        </div>
      </div>

      {/* LOGOUT */}
      <div className="settings-card">
        <button className="logout-btn" onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} /> Đăng Xuất
        </button>
      </div>
    </div>
  );
}
