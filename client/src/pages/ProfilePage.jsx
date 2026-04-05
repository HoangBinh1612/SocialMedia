import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileAPI } from '../api/profile.api';
import { postAPI } from '../api/post.api';
import { friendAPI } from '../api/friend.api';
import { uploadAPI } from '../api/upload.api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import PostCard from '../components/post/PostCard';
import toast from 'react-hot-toast';
import { Camera, Edit2, MapPin, Gift, Heart, GraduationCap } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAboutPopup, setShowAboutPopup] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editEdu, setEditEdu] = useState('');
  const [friendStatus, setFriendStatus] = useState(null);

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    loadProfile(); loadPosts(); loadFriends();
    if (userId && userId !== currentUser?._id) loadFriendStatus();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('NEW_POST', (post) => {
      // In profile, if it's not the same user, we might ignore, but for simplicity we can just check if user matches
      if (!isOwnProfile && post.user?._id !== userId) return;
      setPosts(prev => {
        if (prev.find(p => p._id === post._id)) return prev;
        return [post, ...prev];
      });
    });
    socket.on('POST_UPDATED', (post) => {
      setPosts(prev => prev.map(p => p._id === post._id ? post : p));
    });
    socket.on('POST_DELETED', (data) => {
      setPosts(prev => prev.filter(p => p._id !== data.postId));
    });

    return () => {
      socket.off('NEW_POST');
      socket.off('POST_UPDATED');
      socket.off('POST_DELETED');
    };
  }, [socket, isOwnProfile, userId]);

  const loadProfile = async () => {
    try {
      const res = isOwnProfile
        ? await profileAPI.getMe()
        : await profileAPI.getUser(userId);
      setProfile(res.data);
      setEditBio(res.data.bio || '');
      setEditLocation(res.data.location || '');
      setEditBirthday(res.data.birthday ? res.data.birthday.substring(0, 10) : '');
      setEditRelationship(res.data.relationship || '');
      setEditEdu(res.data.edu || '');
    } catch (err) {} finally { setLoading(false); }
  };

  const loadPosts = async () => {
    try {
      const res = isOwnProfile
        ? await postAPI.getMyPosts()
        : await postAPI.getByUser(userId);
      setPosts(res.data || []);
    } catch (err) {}
  };

  const loadFriends = async () => {
    try {
      const res = isOwnProfile
        ? await friendAPI.getList()
        : await friendAPI.getProfileFriends(userId);
      setFriends(res.data || []);
    } catch (err) {}
  };

  const loadFriendStatus = async () => {
    try {
      const res = await friendAPI.getStatus(userId);
      setFriendStatus(res.data?.status || null);
    } catch (err) {}
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const res = await uploadAPI.avatar(file);
      setProfile(prev => ({ ...prev, avatarUrl: res.data.url }));
      await profileAPI.updateMe({ avatarUrl: res.data.url });
      toast.success('Đã cập nhật ảnh đại diện!');
    } catch (err) { toast.error('Lỗi upload'); }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const res = await uploadAPI.cover(file);
      setProfile(prev => ({ ...prev, coverUrl: res.data.url }));
      await profileAPI.updateMe({ coverUrl: res.data.url });
      toast.success('Đã cập nhật ảnh bìa!');
    } catch (err) { toast.error('Lỗi upload'); }
  };

  const saveAbout = async () => {
    try {
      await profileAPI.updateMe({
        bio: editBio, location: editLocation,
        birthday: editBirthday || undefined,
        relationship: editRelationship, edu: editEdu
      });
      setProfile(prev => ({
        ...prev, bio: editBio, location: editLocation,
        birthday: editBirthday, relationship: editRelationship, edu: editEdu
      }));
      setShowAboutPopup(false);
      toast.success('Đã cập nhật thông tin!');
    } catch (err) { toast.error('Cập nhật thất bại'); }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return '—'; }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: 40 }}>Không tìm thấy hồ sơ</div>;

  return (
    <div className="profile-page-old">
      <div className="profile-main">
        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="profile-cover">
            <div className="profile-cover-img" style={{
              backgroundImage: `url(${profile.coverUrl || 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&h=300&fit=crop'})`
            }} />
            {isOwnProfile && (
              <div className="cover-edit" onClick={() => document.getElementById('coverInput').click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={20} color="#333" />
              </div>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar" style={{
                backgroundImage: `url(${profile.avatarUrl || 'https://ui-avatars.com/api/?name=' + (profile.username || 'U')})`
              }} />
              {isOwnProfile && (
                <div className="avatar-edit" onClick={() => document.getElementById('avatarInput').click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={16} color="#333" />
                </div>
              )}
            </div>
            <div className="profile-name">{profile.fullName || profile.username}</div>
            <div className="profile-bio">
              <span>{profile.bio || '"Living the sweetest life 🍬♡"'}</span>
              {isOwnProfile && <span className="edit-icon" onClick={() => setShowAboutPopup(true)}>⋯</span>}
            </div>
            <div className="profile-stats">
              <div><strong>{posts.length}</strong><span> Bài Viết</span></div>
              <div><strong>{friends.length}</strong><span> Bạn Bè</span></div>
              <div><strong>0</strong><span> Cộng Đồng</span></div>
            </div>
            {!isOwnProfile && (
              <div style={{ marginTop: 10 }}>
                {friendStatus === 'FRIENDS' && (
                  <button className="btn-save" style={{ background: '#ddd', color: '#333' }}
                    onClick={async () => { await friendAPI.remove(userId); setFriendStatus(null); toast.success('Đã huỷ kết bạn'); }}>
                    ✅ Bạn bè
                  </button>
                )}
                {friendStatus === 'PENDING_SENT' && (
                  <button className="btn-save" disabled style={{ opacity: 0.6 }}>Đã gửi lời mời</button>
                )}
                {friendStatus === 'PENDING_RECEIVED' && (
                  <button className="btn-save"
                    onClick={async () => { await friendAPI.accept(userId); setFriendStatus('FRIENDS'); toast.success('Đã chấp nhận!'); }}>
                    Chấp nhận lời mời
                  </button>
                )}
                {(!friendStatus || friendStatus === 'NONE') && (
                  <button className="btn-save"
                    onClick={async () => { await friendAPI.send(userId); setFriendStatus('PENDING_SENT'); toast.success('Đã gửi lời mời!'); }}>
                    + Kết bạn
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* POSTS */}
        <div className="card-premium"><h3>Bài Viết Gần Đây</h3></div>
        {posts.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>No posts yet…</p>}
        {posts.map(p => <PostCard key={p._id} post={p}
          onDelete={(id) => setPosts(prev => prev.filter(x => x._id !== id))}
          onUpdate={(up) => setPosts(prev => prev.map(x => x._id === up._id ? up : x))} />)}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="profile-right">
        {/* Giới thiệu */}
        <div className="card-premium">
          <h3 className="card-title" style={{ color: '#E88DB5' }}>
            Giới thiệu
            {isOwnProfile && <button className="about-edit-btn" onClick={() => setShowAboutPopup(true)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Edit2 size={14} /> Chỉnh Sửa</button>}
          </h3>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Gift size={16} color="#888" /> Ngày Sinh: {formatDate(profile.birthday)}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} color="#888" /> Sống tại: {profile.location || '—'}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Heart size={16} color="#888" /> Mối quan hệ: {profile.relationship || '—'}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={16} color="#888" /> Trường học: {profile.edu || '—'}</p>
        </div>

        {/* Bạn Bè */}
        <div className="card-premium">
          <h3 className="card-title" style={{ color: '#E88DB5' }}>Bạn Bè</h3>
          {friends.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14 }}>Chưa có bạn bè</p>
          ) : (
            friends.slice(0, 6).map(f => {
              const friendData = f.friend || f; // Fallback in case Backend was fixed differently
              return (
                <div key={f._id} style={{ padding: '4px 0', fontSize: 14 }}>
                  <Link to={'/profile/' + friendData._id} className="friend-name-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {friendData.fullName || friendData.username}
                  </Link>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* HIDDEN INPUTS */}
      <input type="file" id="avatarInput" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
      <input type="file" id="coverInput" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />

      {/* ABOUT POPUP */}
      {showAboutPopup && (
        <div className="about-popup" onClick={() => setShowAboutPopup(false)}>
          <div className="about-popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>Chỉnh Sửa Thông Tin</h2>
            <label>Tiểu Sử</label>
            <input value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Viết gì đó..." />
            <label>Ngày Sinh</label>
            <input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} />
            <label>Địa Điểm</label>
            <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Tp. Hồ Chí Minh" />
            <label>Mối Quan Hệ</label>
            <input value={editRelationship} onChange={(e) => setEditRelationship(e.target.value)} placeholder="Độc thân" />
            <label>Trường Học</label>
            <input value={editEdu} onChange={(e) => setEditEdu(e.target.value)} placeholder="Đại học..." />
            <div className="popup-buttons">
              <button className="btn-cancel" onClick={() => setShowAboutPopup(false)}>Huỷ</button>
              <button className="btn-save" onClick={saveAbout}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
