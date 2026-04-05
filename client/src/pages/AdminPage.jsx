import { useState, useEffect } from 'react';
import { adminAPI } from '../api/admin.api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Globe, Lock, Activity, Users, FileText, MessageSquare } from 'lucide-react';
import './AdminPage.css';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); loadUsers(); loadPosts(); loadComments(); loadCommunities(); }, []);

  const loadStats = async () => {
    try { const res = await adminAPI.getStats(); setStats(res.data); } catch (err) {}
    setLoading(false);
  };
  const loadUsers = async () => {
    try { const res = await adminAPI.getUsers(); setUsers(res.data || []); } catch (err) {}
  };
  const loadPosts = async () => {
    try { const res = await adminAPI.getPosts(); setPosts(res.data || []); } catch (err) {}
  };
  const loadComments = async () => {
    try { const res = await adminAPI.getComments(); setComments(res.data || []); } catch (err) {}
  };
  const loadCommunities = async () => {
    try { const res = await adminAPI.getCommunities(); setCommunities(res.data || []); } catch (err) {}
  };

  const handleBan = async (userId) => {
    if (!window.confirm('Ban người dùng này?')) return;
    try { await adminAPI.banUser(userId); toast.success('Đã ban!'); loadUsers(); }
    catch (err) { toast.error('Thao tác thất bại'); }
  };
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Xoá bài viết này?')) return;
    try { await adminAPI.deletePost(postId); toast.success('Đã xoá!'); loadPosts(); }
    catch (err) { toast.error('Thao tác thất bại'); }
  };
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Xoá bình luận này?')) return;
    try { await adminAPI.deleteComment(commentId); toast.success('Đã xoá!'); loadComments(); }
    catch (err) { toast.error('Thao tác thất bại'); }
  };
  const handleDeleteCommunity = async (id) => {
    if (!window.confirm('Xoá cộng đồng này?')) return;
    try { await adminAPI.deleteCommunity(id); toast.success('Đã xoá!'); loadCommunities(); loadStats(); }
    catch (err) { toast.error('Thao tác thất bại'); }
  };

  const navItems = [
    { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard' },
    { id: 'users', icon: <Users size={18} />, label: 'Users' },
    { id: 'posts', icon: <FileText size={18} />, label: 'Posts' },
    { id: 'comments', icon: <MessageSquare size={18} />, label: 'Comments' },
    { id: 'communities', icon: <Globe size={18} />, label: 'Communities' },
  ];

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <div className="admin-logo">🛡️ Admin</div>
        <ul className="admin-nav-menu">
          {navItems.map(item => (
            <li key={item.id} className="admin-nav-item">
              <div className={'admin-nav-link' + (section === item.id ? ' active' : '')}
                onClick={() => setSection(item.id)}>
                <span>{item.icon}</span> <span>{item.label}</span>
              </div>
            </li>
          ))}
          <li className="admin-nav-item">
            <div className="admin-nav-link" onClick={() => navigate('/feed')}>
              <span>🏠</span> <span>Về Trang Chính</span>
            </div>
          </li>
        </ul>
      </div>

      {/* MAIN */}
      <div className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <div className="admin-user-info">
            <span>{user?.username}</span>
            <button className="admin-logout-btn" onClick={logout}>Đăng Xuất</button>
          </div>
        </div>

        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: 20, color: '#333' }}>📊 System Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">Tổng Users</div><div className="stat-number">{stats?.totalUsers || 0}</div></div>
              <div className="stat-card"><div className="stat-label">Tổng Posts</div><div className="stat-number">{stats?.totalPosts || 0}</div></div>
              <div className="stat-card"><div className="stat-label">Tổng Comments</div><div className="stat-number">{stats?.totalComments || 0}</div></div>
              <div className="stat-card"><div className="stat-label">Tổng Cộng Đồng</div><div className="stat-number">{stats?.totalCommunities || 0}</div></div>
            </div>
          </div>
        )}

        {/* USERS */}
        {section === 'users' && (
          <div>
            <h2 style={{ marginBottom: 20, color: '#333' }}>👥 User Management</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><div className="user-info-cell">
                        <img src={u.avatarUrl || 'https://ui-avatars.com/api/?name=' + u.username} alt=""
                          style={{ width: 40, height: 40, borderRadius: '50%' }}
                          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + u.username; }} />
                        <span>{u.username}</span>
                      </div></td>
                      <td>{u.email}</td>
                      <td><span className={'role-badge ' + (u.role?.name === 'ADMIN' ? 'role-admin' : 'role-user')}>
                        {u.role?.name || 'USER'}
                      </span></td>
                      <td>
                        {u.role?.name !== 'ADMIN' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleBan(u._id)}>Ban</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POSTS */}
        {section === 'posts' && (
          <div>
            <h2 style={{ marginBottom: 20, color: '#333' }}>📝 Post Management</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Author</th><th>Content</th><th>Actions</th></tr></thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p._id}>
                      <td>{p.user?.username || '—'}</td>
                      <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(p._id)}>Xoá</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMMENTS */}
        {section === 'comments' && (
          <div>
            <h2 style={{ marginBottom: 20, color: '#333' }}>💬 Comment Management</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>User</th><th>Post</th><th>Content</th><th>Actions</th></tr></thead>
                <tbody>
                  {comments.map(c => (
                    <tr key={c._id}>
                      <td>{c.user?.username || '—'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.post?.content || '—'}</td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteComment(c._id)}>Xoá</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMMUNITIES */}
        {section === 'communities' && (
          <div>
            <h2 style={{ marginBottom: 20, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={24}/> Community Management</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Privacy</th><th>Members</th><th>Creator</th><th>Actions</th></tr></thead>
                <tbody>
                  {communities.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {c.privacy === 'PUBLIC' ? <><Globe size={14} color="#666"/> Công khai</> : <><Lock size={14} color="#666"/> Riêng tư</>}
                        </span>
                      </td>
                      <td>{c.memberCount}</td>
                      <td>{c.createdBy?.username || c.createdBy?.fullName || '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteCommunity(c._id)}>Xoá</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
