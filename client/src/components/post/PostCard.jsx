import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { reactionAPI } from '../../api/reaction.api';
import { commentAPI } from '../../api/comment.api';
import { postAPI } from '../../api/post.api';
import { uploadAPI } from '../../api/upload.api';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Trash2, Edit3, Send, Camera, X, Smile, ThumbsUp, MessageSquare, Share2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import './PostCard.css';

const reactionEmojis = {
  like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡'
};

const commentEmojiList = ['😀','😂','🤣','😊','😍','❤️','👍','😮','😢','😡','🔥','🎉','✨','💯','🙌'];

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentImageFile, setCommentImageFile] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [fullImage, setFullImage] = useState(null); // Lightbox state
  const [myReaction, setMyReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(post.reactionCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user && post.user && user._id === post.user._id;

  useEffect(() => {
    if (user) {
      reactionAPI.myReaction(post._id).then(res => {
        if (res.data.type) setMyReaction(res.data.type);
      }).catch(() => {});
    }
  }, [post._id, user]);

  useEffect(() => {
    if (!socket) return;
    
    const onNewComment = (data) => {
      if (data.postId === post._id) {
        setComments(prev => {
          if (prev.find(c => c._id === data.comment._id)) return prev;
          return [...prev, data.comment];
        });
        setCommentCount(prev => prev + 1);
      }
    };
    
    const onCommentUpdated = (data) => {
      if (data.postId === post._id) {
        setComments(prev => prev.map(c => c._id === data.comment._id ? data.comment : c));
      }
    };
    
    const onCommentDeleted = (data) => {
      if (data.postId === post._id) {
        setComments(prev => prev.filter(c => c._id !== data.commentId));
        setCommentCount(prev => prev - 1);
      }
    };

    socket.on('NEW_COMMENT', onNewComment);
    socket.on('COMMENT_UPDATED', onCommentUpdated);
    socket.on('COMMENT_DELETED', onCommentDeleted);

    return () => {
      socket.off('NEW_COMMENT', onNewComment);
      socket.off('COMMENT_UPDATED', onCommentUpdated);
      socket.off('COMMENT_DELETED', onCommentDeleted);
    };
  }, [socket, post._id]);

  const handleReact = async (type) => {
    try {
      if (myReaction === type) {
        await reactionAPI.unreact(post._id);
        setMyReaction(null);
        setReactionCount(prev => prev - 1);
      } else {
        await reactionAPI.react(post._id, type);
        if (!myReaction) setReactionCount(prev => prev + 1);
        setMyReaction(type);
      }
      setShowReactions(false);
    } catch (err) { toast.error('Thao tác thất bại'); }
  };

  const loadComments = async () => {
    try { const res = await commentAPI.getByPost(post._id); setComments(res.data); } catch (err) {}
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImageFile) return;
    try {
      let imageUrl = "";
      if (commentImageFile) {
        let upRes = await uploadAPI.image(commentImageFile);
        imageUrl = upRes.data.url;
      }
      const res = await commentAPI.create(post._id, { content: commentText, imageUrl });
      setComments([...comments, res.data]);
      setCommentText('');
      setCommentImageFile(null);
      setCommentImagePreview(null);
      setCommentCount(prev => prev + 1);
    } catch (err) { toast.error('Bình luận thất bại'); }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDelete = async () => {
    try {
      await postAPI.delete(post._id);
      toast.success('Đã xoá bài viết');
      onDelete && onDelete(post._id);
    } catch (err) { toast.error('Xoá thất bại'); }
    setShowDeleteConfirm(false);
  };

  const handleEdit = async () => {
    try {
      const res = await postAPI.update(post._id, { content: editContent });
      onUpdate && onUpdate(res.data);
      setEditing(false);
      toast.success('Đã cập nhật bài viết');
    } catch (err) { toast.error('Cập nhật thất bại'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentAPI.delete(post._id, commentId);
      setComments(comments.filter(c => c._id !== commentId));
      setCommentCount(prev => prev - 1);
    } catch (err) {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return mins + ' phút trước';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + ' giờ trước';
    return Math.floor(hrs / 24) + ' ngày trước';
  };

  return (
    <div className="post-card">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="about-popup-box" style={{ width: 400, maxWidth: '90%', padding: '30px', textAlign: 'center', animation: 'scaleIn 0.3s ease', background: 'white', borderRadius: 16 }} onClick={(e) => e.stopPropagation()}>
            <Trash2 size={48} color="#ff4d4f" style={{ marginBottom: 15 }} />
            <h2 style={{ marginBottom: 10, color: '#333' }}>Xoá bài viết này?</h2>
            <p style={{ color: '#666', marginBottom: 25 }}>Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này không?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
              <button style={{ flex: 1, padding: '10px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }} onClick={confirmDelete}>Xác nhận: Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="post-header">
        <Link to={'/profile/' + post.user?._id} className="post-user">
          <img src={post.user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + post.user?.username}
            alt="" className="avatar-large"
            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + post.user?.username; }} />
          <div>
            <div className="post-username" style={{ display: 'inline-block' }}>
              {post.user?.fullName || post.user?.username}
              {post.community && (
                <span style={{ fontWeight: 400, color: '#666', fontSize: 13 }}>
                  {' ▹ '} <Link to={`/communities/${post.community._id}`} style={{ fontWeight: 700, color: '#E88DB5', textDecoration: 'none' }}>{post.community.name}</Link>
                </span>
              )}
              {post.feeling && <span style={{ fontWeight: 400, color: '#666', fontSize: 13 }}> — đang cảm thấy <b>{post.feeling}</b></span>}
              {post.location && <span style={{ fontWeight: 400, color: '#666', fontSize: 13 }}> tại <b>{post.location}</b></span>}
            </div>
            <div className="post-time" style={{ marginTop: 2 }}>
              {timeAgo(post.createdAt)} 
              {post.community && <span style={{ fontSize: 12, color: '#999', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={12}/> Cộng đồng</span>}
            </div>
          </div>
        </Link>
        {isOwner && (
          <div className="post-menu-wrapper">
            <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="post-menu">
                <button onClick={() => { setEditing(true); setShowMenu(false); }}>
                  <Edit3 size={14} /> Chỉnh sửa
                </button>
                <button onClick={handleDelete} className="danger">
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="post-editing">
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
          <div className="edit-actions">
            <button className="btn-cancel" onClick={() => setEditing(false)}>Huỷ</button>
            <button className="btn-save" onClick={handleEdit}>Lưu</button>
          </div>
        </div>
      ) : (
        post.content && <p className="post-content">{post.content}</p>
      )}

      {post.imageUrl && (
        <div className="post-image">
          <img src={post.imageUrl} alt="" className="gummy-image" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      )}

      {post.videoUrl && (
        <div className="post-image">
          <video src={post.videoUrl} controls className="gummy-image" style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', background: 'black' }} />
        </div>
      )}

      {/* Stats */}
      <div className="post-stats">
        <span>{reactionCount > 0 ? reactionCount + ' lượt thích' : ''}</span>
        <span>{commentCount > 0 ? commentCount + ' bình luận' : ''}</span>
      </div>

      {/* Actions — 3 buttons like old FE */}
      <div className="post-actions">
        <div className="reaction-wrapper"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}>
          <button className={'post-btn' + (myReaction ? ' liked' : '')}
            onClick={() => handleReact(myReaction || 'like')}>
            {myReaction 
              ? `${reactionEmojis[myReaction]} ${reactionCount}` 
              : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ThumbsUp size={16} /> {reactionCount > 0 ? reactionCount : 'Thích'}</div>}
          </button>
          {showReactions && (
            <div className="reaction-picker">
              {Object.entries(reactionEmojis).map(([type, emoji]) => (
                <button key={type} onClick={() => handleReact(type)}
                  className={'reaction-option' + (myReaction === type ? ' active' : '')}
                  title={type}>{emoji}</button>
              ))}
            </div>
          )}
        </div>
        <button className="post-btn" onClick={toggleComments} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MessageSquare size={16} /> {commentCount > 0 ? `${commentCount} Bình Luận` : 'Bình Luận'}
        </button>
        <button className="post-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Share2 size={16} /> Chia Sẻ
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="post-comments">
          {comments.map(c => (
            <div key={c._id} className="comment-item">
              <Link to={'/profile/' + c.user?._id}>
                <img src={c.user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + c.user?.username}
                  alt="" onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + c.user?.username; }} />
              </Link>
              <div className="comment-body">
                <Link to={'/profile/' + c.user?._id} className="comment-name-link">
                  <span className="comment-author">{c.user?.fullName || c.user?.username}</span>
                </Link>
                <div className="comment-content-wrapper">
                  {c.content && <span className="comment-text">{c.content}</span>}
                  {c.imageUrl && (
                    <img src={c.imageUrl} alt="Cmt" className="comment-image" onClick={() => setFullImage(c.imageUrl)} />
                  )}
                </div>
                <span className="comment-time">{timeAgo(c.createdAt)}</span>
              </div>
              {user && c.user?._id === user._id && (
                <button className="comment-delete" onClick={() => handleDeleteComment(c._id)}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          
          <form className="comment-form" onSubmit={handleComment}>
            <div className="comment-input-area" style={{ position: 'relative' }}>
              <input type="text" placeholder="Viết bình luận..." value={commentText}
                onChange={(e) => setCommentText(e.target.value)} />
              
              <label className="comment-camera-btn">
                <Camera size={18} />
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                  if (e.target.files[0]) {
                    setCommentImageFile(e.target.files[0]);
                    setCommentImagePreview(URL.createObjectURL(e.target.files[0]));
                  }
                }} />
              </label>

              <button type="button" className="comment-action-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Smile size={18} />
              </button>

              {showEmojiPicker && (
                <div className="comment-emoji-picker">
                  {commentEmojiList.map(emoji => (
                    <span key={emoji} onClick={() => {
                      setCommentText(prev => prev + emoji);
                    }}>{emoji}</span>
                  ))}
                </div>
              )}
              
              <button type="submit" disabled={!commentText.trim() && !commentImageFile} className="comment-submit-btn">
                <Send size={18} />
              </button>
            </div>
          </form>

          {commentImagePreview && (
            <div className="comment-preview-box">
              <img src={commentImagePreview} alt="Preview" />
              <button onClick={() => { setCommentImageFile(null); setCommentImagePreview(null); }}><X size={14}/></button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox for viewing full image */}
      {fullImage && (
        <div className="lightbox-overlay" onClick={() => setFullImage(null)}>
          <div className="lightbox-close" onClick={() => setFullImage(null)}><X size={32} /></div>
          <img src={fullImage} alt="Full" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
}
