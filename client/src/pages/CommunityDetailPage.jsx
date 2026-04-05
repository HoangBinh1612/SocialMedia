import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityAPI } from '../api/community.api';
import { uploadAPI } from '../api/upload.api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import PostCard from '../components/post/PostCard';
import CreatePost from '../components/post/CreatePost';
import { Camera, Globe, Lock, Trash2, LogOut } from 'lucide-react';
import './CommunityDetailPage.css';

export default function CommunityDetailPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const coverInputRef = useRef(null);

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('NEW_POST', (post) => {
      // Only add to this community's feed if it belongs to it
      if (post.community?._id !== communityId && post.community !== communityId) return;
      setPosts(prev => {
        if (prev.find(p => p._id === post._id)) return prev;
        return [post, ...prev];
      });
    });
    socket.on('POST_UPDATED', (post) => {
      if (post.community?._id !== communityId && post.community !== communityId) return;
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
  }, [socket, communityId]);

  const loadCommunity = async () => {
    try {
      const res = await communityAPI.getCommunity(communityId);
      setCommunity(res.data);
      if (res.data.privacy === 'PUBLIC' || res.data.myStatus === 'APPROVED') {
        loadPosts();
      }
      if (res.data.myRole === 'ADMIN') {
        loadRequests();
      }
    } catch (err) {
      toast.error('Không thể tải cộng đồng');
    }
    setLoading(false);
  };

  const loadPosts = async () => {
    try {
      const res = await communityAPI.getPosts(communityId);
      setPosts(res.data || []);
    } catch (err) {}
  };

  const loadRequests = async () => {
    try {
      const res = await communityAPI.getRequests(communityId);
      setRequests(res.data || []);
    } catch (err) {}
  };

  const handleJoin = async () => {
    try {
      const res = await communityAPI.joinCommunity(communityId);
      toast.success(res.data.status === 'PENDING' ? 'Đã gửi yêu cầu tham gia' : 'Tham gia thành công!');
      loadCommunity();
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleLeave = async () => {
    setConfirmDialog({
      title: "Rời khỏi Nhóm",
      message: "Bạn có chắc chắn muốn rời khỏi cộng đồng này?",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await communityAPI.leaveCommunity(communityId);
          toast.success('Đã rời khỏi nhóm');
          loadCommunity();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
        }
      }
    });
  };

  const handleApprove = async (userId) => {
    try {
      await communityAPI.approveRequest(communityId, userId);
      toast.success('Đã duyệt thành viên!');
      loadCommunity();
    } catch (err) {
      toast.error('Lỗi duyệt thành viên');
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingCover(true);
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const upRes = await uploadAPI.image(file);
      const newCoverUrl = upRes.data.url;
      await communityAPI.updateCover(communityId, newCoverUrl);
      setCommunity(prev => ({ ...prev, coverUrl: newCoverUrl }));
      toast.success('Đã cập nhật ảnh bìa!', { id: toastId });
    } catch (err) {
      toast.error('Cập nhật thất bại', { id: toastId });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({
      title: "Xóa Nhóm",
      message: "CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn cộng đồng. Bạn có chắc chắn?",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await communityAPI.deleteCommunity(communityId);
          toast.success('Đã xóa cộng đồng');
          navigate('/communities');
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Xóa thất bại');
        }
      }
    });
  };

  const handlePrivacyChange = (targetPrivacy) => {
    setShowPrivacyMenu(false);
    if (community.privacy === targetPrivacy) return;

    setConfirmDialog({
      title: "Chuyển Đổi Quyền Riêng Tư",
      message: `Bạn có chắc chắn muốn chuyển nhóm này sang tính chất ${targetPrivacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await communityAPI.updatePrivacy(communityId, targetPrivacy);
          setCommunity(prev => ({ ...prev, privacy: targetPrivacy }));
          toast.success(`Đã chuyển nhóm thành ${targetPrivacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}`);
        } catch (err) {
          toast.error('Lỗi chuyển trạng thái riêng tư');
        }
      }
    });
  };


  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>;
  if (!community) return <div style={{ textAlign: 'center', padding: 40 }}>Cộng đồng không tồn tại</div>;

  const canViewContent = community.privacy === 'PUBLIC' || community.myStatus === 'APPROVED';

  return (
    <div className="comm-detail-container">
      <div className="comm-detail-header">
        <div className="comm-cover" style={{ backgroundImage: `url(${community.coverUrl || 'https://images.unsplash.com/photo-1510007558661-d00af420d187?w=1000'})`, position: 'relative' }}>
          {community.myRole === 'ADMIN' && (
            <>
              <input type="file" hidden ref={coverInputRef} accept="image/*" onChange={handleCoverChange} />
              <button 
                onClick={() => coverInputRef.current?.click()} 
                disabled={uploadingCover}
                style={{ position: 'absolute', bottom: 15, right: 15, background: 'rgba(255,255,255,0.9)', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
              >
                {uploadingCover ? '⏳ Đang tải...' : <><Camera size={16} /> Cập nhật Ảnh Bìa</>}
              </button>
            </>
          )}
        </div>
        <div className="comm-info-bar">
          <div className="comm-title-wrap">
            <h2>{community.name}</h2>
            <div className="comm-meta" style={{ position: 'relative' }}>
              {community.myRole === 'ADMIN' ? (
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 12, padding: '4px 10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#444' }}
                  >
                    {community.privacy === 'PUBLIC' ? <><Globe size={14} color="#666" /> Công khai</> : <><Lock size={14} color="#666" /> Riêng tư</>} <span style={{ fontSize: 10 }}>▼</span>
                  </button>
                  
                  {showPrivacyMenu && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 5, background: 'white', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: 140, overflow: 'hidden' }}>
                      <div onClick={() => handlePrivacyChange('PUBLIC')} style={{ padding: '10px 15px', cursor: 'pointer', background: community.privacy === 'PUBLIC' ? '#f0f0f0' : 'white', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><Globe size={16} color="#666" /> Công khai</div>
                      <div onClick={() => handlePrivacyChange('PRIVATE')} style={{ padding: '10px 15px', cursor: 'pointer', background: community.privacy === 'PRIVATE' ? '#f0f0f0' : 'white', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><Lock size={16} color="#666" /> Riêng tư</div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="privacy-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {community.privacy === 'PUBLIC' ? <><Globe size={14} color="#666" /> Công khai</> : <><Lock size={14} color="#666" /> Riêng tư</>}
                </span>
              )}
              <span style={{ marginLeft: 8 }}>•</span>
              <span>{community.memberCount} thành viên</span>
            </div>
            {community.description && <p className="comm-desc">{community.description}</p>}
          </div>

          <div className="comm-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {community.myRole === 'ADMIN' && (
              <button className="comm-btn-join" style={{ background: '#ff4d4f', borderColor: '#ff4d4f', display: 'flex', alignItems: 'center', gap: 5 }} onClick={handleDelete}>
                <Trash2 size={16} /> Xóa Nhóm
              </button>
            )}
            
            {community.myRole !== 'ADMIN' && (
              <>
                {community.myStatus === 'APPROVED' ? (
                  <button className="comm-btn-leave" onClick={handleLeave} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><LogOut size={16} /> Rời Nhóm</button>
                ) : community.myStatus === 'PENDING' ? (
                  <button className="comm-btn-pending" onClick={handleLeave}>Hủy yêu cầu</button>
                ) : (
                  <button className="comm-btn-join" onClick={handleJoin}>Tham gia Nhóm</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="comm-detail-body">
        {community.myRole === 'ADMIN' && requests.length > 0 && (
          <div className="comm-requests">
            <h3>Yêu cầu tham gia mới ({requests.length})</h3>
            {requests.map(req => (
              <div key={req._id} className="comm-req-item">
                <img src={req.user.avatarUrl || '/default-avatar.png'} alt="" className="req-avatar" />
                <span className="req-name">{req.user.fullName}</span>
                <button className="req-btn-approve" onClick={() => handleApprove(req.user._id)}>Duyệt</button>
              </div>
            ))}
          </div>
        )}

        {canViewContent ? (
          <div className="comm-feed">
            {community.myStatus === 'APPROVED' && (
              <CreatePost communityId={communityId} onPostCreated={loadPosts} />
            )}
            
            {posts.length === 0 ? (
              <div className="comm-empty">Chưa có bài viết nào trong nhóm này.</div>
            ) : (
              posts.map(post => (
                <PostCard key={post._id} post={post} onUpdate={loadPosts} onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))} />
              ))
            )}
          </div>
        ) : (
          <div className="comm-private-lock">
            <div className="lock-icon"><Lock size={40} color="#ccc" /></div>
            <h3>Nhóm riêng tư</h3>
            <p>Tham gia nhóm này để xem và chia sẻ bài viết với các thành viên khác.</p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRM DIALOG */}
      {confirmDialog && (
        <div className="comm-dialog-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="comm-dialog" onClick={e => e.stopPropagation()}>
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="comm-dialog-actions">
              <button className="comm-dialog-cancel" onClick={() => setConfirmDialog(null)}>Hủy</button>
              <button className="comm-dialog-confirm" onClick={confirmDialog.onConfirm}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
