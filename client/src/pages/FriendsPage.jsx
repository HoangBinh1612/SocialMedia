import { useState, useEffect } from 'react';
import { friendAPI } from '../api/friend.api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './FriendsPage.css';

export default function FriendsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [reqRes, sugRes, frRes] = await Promise.all([
        friendAPI.getPending(),
        friendAPI.getSuggestions(),
        friendAPI.getList()
      ]);
      setRequests(reqRes.data || []);
      setSuggestions(sugRes.data || []);
      setFriends(frRes.data || []);
    } catch (err) {}
    setLoading(false);
  };

  const handleAccept = async (senderUserId) => {
    try {
      await friendAPI.accept(senderUserId);
      setRequests(requests.filter(r => r.user._id !== senderUserId));
      toast.success('Đã chấp nhận lời mời!');
      loadAll();
    } catch (err) { toast.error('Thao tác thất bại'); }
  };

  const handleReject = async (senderUserId) => {
    try {
      await friendAPI.reject(senderUserId);
      setRequests(requests.filter(r => r.user._id !== senderUserId));
      toast.success('Đã từ chối lời mời');
    } catch (err) { toast.error('Thao tác thất bại'); }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendAPI.send(userId);
      setSuggestions(suggestions.filter(s => s._id !== userId));
      toast.success('Đã gửi lời mời kết bạn!');
    } catch (err) { toast.error('Gửi lời mời thất bại'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>;

  return (
    <div className="friends-page-old">
      <div className="friends-center">
        {/* FRIEND REQUESTS */}
        <div className="friends-card">
          <div className="friends-title">Lời mời kết bạn</div>
          {requests.length === 0 ? (
            <p style={{ color: '#999' }}>Không có lời mời nào</p>
          ) : (
            requests.map(r => {
              const sender = r.user || {};
              return (
                <div key={r._id} className="friend-item">
                  <Link to={'/profile/' + sender._id}>
                    <img className="friend-avatar"
                      src={sender.avatarUrl || 'https://ui-avatars.com/api/?name=' + (sender.username || 'U')} alt=""
                      onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (sender.username || 'U'); }} />
                  </Link>
                  <div className="friend-info">
                    <Link to={'/profile/' + sender._id} className="friend-name-link">
                      <div className="friend-name">{sender.fullName || sender.username}</div>
                    </Link>
                    <div>
                      <button className="friend-btn btn-confirm" onClick={() => handleAccept(sender._id)}>Xác nhận</button>
                      <button className="friend-btn btn-delete" onClick={() => handleReject(sender._id)}>Xoá</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SUGGESTIONS */}
        <div className="friends-card">
          <div className="friends-title">Gợi ý kết bạn</div>
          {suggestions.length === 0 ? (
            <p style={{ color: '#999' }}>Không có gợi ý nào</p>
          ) : (
            suggestions.map(s => (
              <div key={s._id} className="friend-item">
                <Link to={'/profile/' + s._id}>
                  <img className="friend-avatar"
                    src={s.avatarUrl || 'https://ui-avatars.com/api/?name=' + (s.username || 'U')} alt=""
                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (s.username || 'U'); }} />
                </Link>
                <div className="friend-info">
                  <Link to={'/profile/' + s._id} className="friend-name-link">
                    <div className="friend-name">{s.fullName || s.username}</div>
                  </Link>
                  <button className="friend-btn btn-add" onClick={() => handleSendRequest(s._id)}>Kết bạn</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: DANH SÁCH BẠN BÈ */}
      <div className="friends-right">
        <div className="friends-card">
          <h3 className="card-title">Danh sách bạn bè</h3>
          {friends.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14 }}>Chưa có bạn bè</p>
          ) : (
            friends.map(f => {
              const data = f.friend || f;
              return (
              <div key={f._id || data._id} className="friend-item" style={{ padding: '8px 0' }}>
                  <Link to={'/profile/' + data._id} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }} className="friend-name-link">
                    <img style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      src={data.avatarUrl || 'https://ui-avatars.com/api/?name=' + (data.username || 'U')} alt=""
                      onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (data.username || 'U'); }} />
                    <span style={{ fontWeight: 500 }}>{data.fullName || data.username}</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
