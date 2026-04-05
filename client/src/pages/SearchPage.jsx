import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAPI } from '../api/search.api';
import PostCard from '../components/post/PostCard';
import { Users, FileText, Globe } from 'lucide-react';
import './SearchPage.css';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [hasFetchedPosts, setHasFetchedPosts] = useState(false);
  const [hasFetchedCommunities, setHasFetchedCommunities] = useState(false);

  useEffect(() => {
    if (q.trim()) {
      setTab('users');
      setUsers([]);
      setPosts([]);
      setCommunities([]);
      setHasFetchedPosts(false);
      setHasFetchedCommunities(false);
      
      // Auto fetch users first
      fetchUsers(q);
    }
  }, [q]);

  // Tab switching logic
  useEffect(() => {
    if (!q.trim()) return;
    if (tab === 'posts' && !hasFetchedPosts) fetchPosts(q);
    if (tab === 'communities' && !hasFetchedCommunities) fetchCommunities(q);
  }, [tab, q, hasFetchedPosts, hasFetchedCommunities]);

  const fetchUsers = async (query) => {
    setLoading(true);
    try {
      const res = await searchAPI.users(query);
      setUsers(res.data || []);
    } catch (err) {}
    setLoading(false);
  };

  const fetchPosts = async (query) => {
    setLoading(true);
    try {
      const res = await searchAPI.posts(query);
      setPosts(res.data || []);
      setHasFetchedPosts(true);
    } catch (err) {}
    setLoading(false);
  };

  const fetchCommunities = async (query) => {
    setLoading(true);
    try {
      const res = await searchAPI.communities(query);
      setCommunities(res.data || []);
      setHasFetchedCommunities(true);
    } catch (err) {}
    setLoading(false);
  };

  if (!q.trim()) {
    return (
      <div className="search-page-fullscreen">
        <div className="search-empty">
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔍</div>
          <p>Nhập từ khóa trên thanh tìm kiếm để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page-fullscreen">
      {/* LEFT SEARCH SIDEBAR */}
      <div className="search-sidebar-new">
        <h3 className="search-sidebar-title">Kết quả tìm kiếm</h3>
        <div className="search-sidebar-q">Cho từ khóa: <strong>"{q}"</strong></div>
        
        <div className="search-sidebar-menu">
          <button className={'search-menu-btn' + (tab === 'users' ? ' active' : '')} onClick={() => setTab('users')}>
            <span className="sm-icon" style={{background: tab==='users'?'#E88DB5':'#e4e6eb'}}><Users size={18} color={tab==='users'?'#fff':'#050505'} /></span>
            <span className="sm-text">Người dùng</span>
          </button>
          
          <button className={'search-menu-btn' + (tab === 'posts' ? ' active' : '')} onClick={() => setTab('posts')}>
            <span className="sm-icon" style={{background: tab==='posts'?'#E88DB5':'#e4e6eb'}}><FileText size={18} color={tab==='posts'?'#fff':'#050505'} /></span>
            <span className="sm-text">Bài viết</span>
          </button>
          
          <button className={'search-menu-btn' + (tab === 'communities' ? ' active' : '')} onClick={() => setTab('communities')}>
            <span className="sm-icon" style={{background: tab==='communities'?'#E88DB5':'#e4e6eb'}}><Globe size={18} color={tab==='communities'?'#fff':'#050505'} /></span>
            <span className="sm-text">Cộng đồng</span>
          </button>
        </div>
      </div>

      {/* RIGHT MAIN RESULTS */}
      <div className="search-main-results">
        {loading && <div className="search-empty" style={{marginTop: 50}}>Đang tìm kiếm...</div>}

        {!loading && tab === 'users' && (
          <div className="card-premium">
            <h2 className="search-result-title">Mọi người</h2>
            {users.length === 0 ? (
              <div className="search-empty">Không tìm thấy người dùng nào</div>
            ) : (
              users.map(u => (
                <div key={u._id} className="search-user-item-new" onClick={() => navigate('/profile/' + u._id)}>
                  <img src={u.avatarUrl || 'https://ui-avatars.com/api/?name=' + (u.username || 'U')}
                    alt="" className="search-user-avatar-new"
                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (u.username || 'U'); }} />
                  <div className="search-user-info-new">
                    <div className="search-user-name-new">{u.fullName || u.username}</div>
                    {u.bio && <div className="search-user-bio-new">{u.bio}</div>}
                  </div>
                  <button className="search-action-btn">Xem hồ sơ</button>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && tab === 'posts' && (
          <div className="search-posts-container">
            {posts.length === 0 ? (
              <div className="search-empty card-premium">Không tìm thấy bài viết nào chứa từ khóa "{q}"</div>
            ) : (
              posts.map(p => <PostCard key={p._id} post={p} />)
            )}
          </div>
        )}

        {!loading && tab === 'communities' && (
          <div className="card-premium">
            <h2 className="search-result-title">Cộng đồng</h2>
            {communities.length === 0 ? (
              <div className="search-empty">Không tìm thấy cộng đồng nào</div>
            ) : (
              communities.map(c => (
                <div key={c._id} className="search-community-item" onClick={() => navigate('/community/' + c._id)}>
                  <img src={c.coverUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c'}
                    alt="" className="search-community-avatar" />
                  <div className="search-community-info">
                    <div className="search-community-name">{c.name}</div>
                    <div className="search-community-meta">{c.memberCount} thành viên</div>
                  </div>
                  <button className="search-action-btn">Truy cập</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
