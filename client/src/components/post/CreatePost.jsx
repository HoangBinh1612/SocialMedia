import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communityAPI } from '../../api/community.api';
import { postAPI } from '../../api/post.api';
import { uploadAPI } from '../../api/upload.api';
import toast from 'react-hot-toast';
import { Camera, MapPin, Smile } from 'lucide-react';
import '../../pages/FeedPage.css';

export default function CreatePost({ communityId, onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [feeling, setFeeling] = useState('');
  const [location, setLocation] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [inlineInputVal, setInlineInputVal] = useState('');
  const [posting, setPosting] = useState(false);

  const fileInput = useRef(null);

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !feeling && !location) return;
    setPosting(true);
    try {
      let imageUrl = '';
      let videoUrl = '';
      if (imageFile) {
        const uploadRes = await uploadAPI.media(imageFile);
        if (uploadRes.data.mimetype.startsWith('video')) {
          videoUrl = uploadRes.data.url;
        } else {
          imageUrl = uploadRes.data.url;
        }
      }
      
      if (communityId) {
        await communityAPI.createPost(communityId, { content, imageUrl, videoUrl, feeling, location });
      } else {
        await postAPI.create({ content, imageUrl, videoUrl, feeling, location, privacy: 'PUBLIC' });
      }
      
      setContent(''); setImageFile(null); setImagePreview(null);
      setFeeling(''); setLocation('');
      if (fileInput.current) fileInput.current.value = '';
      toast.success('Đã đăng bài!');
      if (onPostCreated) onPostCreated();
    } catch (err) { 
      toast.error('Đăng bài thất bại'); 
    } finally { 
      setPosting(false); 
    }
  };

  return (
    <div className="card-premium create-post" style={{ marginBottom: 20 }}>
      <div className="cp-top">
        <img className="avatar-large"
          src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + user?.username}
          alt="" onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + user?.username; }} />
        <input style={{ flex: 1 }} placeholder="Bạn muốn chia sẻ điều gì trong nhóm này?"
          value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <input type="file" ref={fileInput} accept="image/*,video/*" style={{ display: 'none' }}
        onChange={handleImageSelect} />

      {imagePreview && (
        <div style={{ position: 'relative', margin: '10px 0' }}>
          {imageFile?.type?.startsWith('video') ? (
            <video src={imagePreview} controls className="gummy-image" style={{ maxHeight: 300, objectFit: 'contain' }} />
          ) : (
            <img src={imagePreview} alt="" className="gummy-image" />
          )}
          <button style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
            onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
        </div>
      )}

      {/* Custom Pill Badges */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: (feeling || location) ? 10 : 0, padding: '0 10px' }}>
        {feeling && (
          <div className="cp-badge fade-in" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Smile size={14} color="#666" /> đang cảm thấy <strong>{feeling}</strong>
            <button onClick={() => setFeeling('')}>✕</button>
          </div>
        )}
        {location && (
          <div className="cp-badge fade-in" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} color="#666" /> tại <strong>{location}</strong>
            <button onClick={() => setLocation('')}>✕</button>
          </div>
        )}
      </div>

      {/* Inline Input area */}
      {activeInput && (
        <div className="cp-inline-input-wrapper slide-down">
          <input 
            autoFocus
            className="cp-inline-input"
            placeholder={activeInput === 'feeling' ? 'Bạn đang cảm thấy thế nào?' : 'Bạn đang ở đâu?'}
            value={inlineInputVal}
            onChange={(e) => setInlineInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (activeInput === 'feeling') setFeeling(inlineInputVal);
                else setLocation(inlineInputVal);
                setActiveInput(null);
                setInlineInputVal('');
              }
            }}
          />
          <div className="cp-inline-actions">
            <button className="cp-inline-ok" onClick={() => {
                if (activeInput === 'feeling') setFeeling(inlineInputVal);
                else setLocation(inlineInputVal);
                setActiveInput(null);
                setInlineInputVal('');
            }}>✓</button>
            <button className="cp-inline-cancel" onClick={() => { setActiveInput(null); setInlineInputVal(''); }}>✕</button>
          </div>
        </div>
      )}

      <div className="cp-actions">
        <button className="cp-btn" onClick={() => fileInput.current.click()} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Camera size={18} color="#666" /> Ảnh/Video
        </button>
        <button className={'cp-btn' + (activeInput === 'feeling' ? ' active' : '')} onClick={() => {
          if (activeInput === 'feeling') setActiveInput(null);
          else { setActiveInput('feeling'); setInlineInputVal(feeling || ''); }
        }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Smile size={18} color="#666" /> Tâm Trạng
        </button>
        <button className={'cp-btn' + (activeInput === 'location' ? ' active' : '')} onClick={() => {
          if (activeInput === 'location') setActiveInput(null);
          else { setActiveInput('location'); setInlineInputVal(location || ''); }
        }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={18} color="#666" /> Địa Điểm
        </button>
      </div>

      <button className="btn-premium cp-post-btn" onClick={handlePost} disabled={posting || (!content.trim() && !imageFile && !feeling && !location)}>
        {posting ? 'Đang đăng...' : 'Đăng'}
      </button>
    </div>
  );
}
