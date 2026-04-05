import { useState, useEffect } from 'react';
import { communityAPI } from '../api/community.api';
import { uploadAPI } from '../api/upload.api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { Camera, Globe, Lock } from 'lucide-react';
import './CommunitiesPage.css';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [owned, setOwned] = useState([]);
  const [joined, setJoined] = useState([]);
  const [suggested, setSuggested] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', privacy: 'PUBLIC' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await communityAPI.getCommunities();
      setOwned(res.data.owned || []);
      setJoined(res.data.joined || []);
      setSuggested(res.data.suggested || []);
    } catch (err) {}
    setLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên cộng đồng');
    setCreating(true);
    try {
      let coverUrl = '';
      if (coverFile) {
        const upRes = await uploadAPI.image(coverFile);
        coverUrl = upRes.data.url;
      }
      
      await communityAPI.createCommunity({ ...form, coverUrl });
      toast.success('Đã tạo cộng đồng mới!');
      setForm({ name: '', description: '', privacy: 'PUBLIC' });
      setCoverFile(null);
      setCoverPreview(null);
      if (fileInput.current) fileInput.current.value = '';
      loadData();
    } catch (err) {
      toast.error('Tạo cộng đồng thất bại');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>;

  return (
    <div className="communities-page">
      <div className="comm-left">
        <h2 className="comm-title">Cộng đồng Gummy</h2>
        
        <div className="comm-create-box">
          <h3>Tạo Cộng đồng Mới</h3>
          <form onSubmit={handleCreate}>
            <input 
              placeholder="Tên cộng đồng" 
              className="comm-input"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            />
            <textarea 
              placeholder="Mô tả cộng đồng" 
              className="comm-input" rows={3}
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            />
            <input type="file" hidden ref={fileInput} accept="image/*" onChange={handleFileChange} />
            <div style={{ marginBottom: 15 }}>
              {coverPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={coverPreview} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInput.current.click()} style={{ width: '100%', padding: '10px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: 8, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Camera size={16} /> Tải lên Ảnh Bìa (Tuỳ chọn)
                </button>
              )}
            </div>
            <select 
              className="comm-input"
              value={form.privacy} onChange={e => setForm({...form, privacy: e.target.value})}
            >
              <option value="PUBLIC">Công khai</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
            <button type="submit" className="comm-btn-primary" disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo Cộng Đồng'}
            </button>
          </form>
        </div>
      </div>

      <div className="comm-right">
        {owned.length > 0 && (
          <div className="comm-section">
            <h3>Cộng đồng của bạn</h3>
            <div className="comm-grid">
              {owned.map(c => (
                <Link to={`/communities/${c._id}`} key={c._id} className="comm-card">
                  <div className="comm-card-cover" style={{ backgroundImage: `url(${c.coverUrl || 'https://images.unsplash.com/photo-1510007558661-d00af420d187?w=400'})` }} />
                  <div className="comm-card-body">
                    <h4>{c.name}</h4>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.privacy === 'PUBLIC' ? <><Globe size={14} color="#666" /> Công khai</> : <><Lock size={14} color="#666" /> Riêng tư</>}
                      </span> • {c.memberCount} thành viên
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {joined.length > 0 && (
          <div className="comm-section">
            <h3>Cộng đồng đã tham gia</h3>
            <div className="comm-grid">
              {joined.map(c => (
                <Link to={`/communities/${c._id}`} key={c._id} className="comm-card">
                  <div className="comm-card-cover" style={{ backgroundImage: `url(${c.coverUrl || 'https://images.unsplash.com/photo-1510007558661-d00af420d187?w=400'})` }} />
                  <div className="comm-card-body">
                    <h4>{c.name}</h4>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.privacy === 'PUBLIC' ? <><Globe size={14} color="#666" /> Công khai</> : <><Lock size={14} color="#666" /> Riêng tư</>}
                      </span> • {c.memberCount} thành viên
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {suggested.length > 0 && (
          <div className="comm-section">
            <h3>Gợi ý cho bạn</h3>
            <div className="comm-grid">
              {suggested.map(c => (
                <Link to={`/communities/${c._id}`} key={c._id} className="comm-card">
                  <div className="comm-card-cover" style={{ backgroundImage: `url(${c.coverUrl || 'https://images.unsplash.com/photo-1510007558661-d00af420d187?w=400'})` }} />
                  <div className="comm-card-body">
                    <h4>{c.name}</h4>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.privacy === 'PUBLIC' ? <><Globe size={14} color="#666" /> Công khai</> : <><Lock size={14} color="#666" /> Riêng tư</>}
                      </span> • {c.memberCount} thành viên
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
