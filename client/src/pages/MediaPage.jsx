import { useState, useEffect } from 'react';
import { mediaAPI } from '../api/media.api';
import { ImageIcon, Film, X, Camera, MapPin, MessageSquare } from 'lucide-react';
import './MediaPage.css';

export default function MediaPage() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(null); // Cho Lightbox

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const res = await mediaAPI.getMyMedia();
      setMediaList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { 
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const groupMediaByDate = () => {
    const groups = {};
    mediaList.forEach(m => {
      const d = new Date(m.createdAt);
      const dateStr = d.toLocaleDateString('vi-VN', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(m);
    });
    return groups;
  };

  const groupedMedia = groupMediaByDate();

  return (
    <div className="media-page-wrapper">
      <div className="media-page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Camera size={32} /> Phương Tiện Của Tôi</h1>
        <p>Kho lưu trữ tất cả hình ảnh và video bạn đã tải lên.</p>
      </div>

      {loading ? (
        <div className="no-media">Đang tải biểu mẫu...</div>
      ) : mediaList.length === 0 ? (
        <div className="no-media">
          <p>Bạn chưa tải lên bất kỳ phương tiện nào.</p>
        </div>
      ) : (
        <div className="media-groups-container">
          {Object.keys(groupedMedia).map(dateLabel => (
            <div key={dateLabel} className="media-date-group">
              <h3 className="media-date-title">{dateLabel}</h3>
              <div className="media-grid">
                {groupedMedia[dateLabel].map((m) => (
                  <div key={m._id} className="media-card" onClick={() => setActiveMedia(m)}>
                    {m.type === 'image' ? (
                      <img src={m.url} alt="Media" />
                    ) : (
                      <video src={m.url} muted />
                    )}
                    
                    <div className="media-card-overlay">
                      <span className="media-source" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {m.source === 'post' ? <><MapPin size={12}/> Bài viết</> : <><MessageSquare size={12}/> Bình luận</>}
                      </span>
                      <span className="media-date">{formatDate(m.createdAt)}</span>
                    </div>

                    <div className="media-icon">
                      {m.type === 'image' ? <ImageIcon size={16} /> : <Film size={16} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      {activeMedia && (
        <div className="media-lightbox-overlay" onClick={() => setActiveMedia(null)}>
          <div className="media-lightbox-close" onClick={() => setActiveMedia(null)}>
            <X size={32} />
          </div>
          {activeMedia.type === 'image' ? (
            <img src={activeMedia.url} className="media-lightbox-content" onClick={(e) => e.stopPropagation()} alt="Phóng to" />
          ) : (
            <video src={activeMedia.url} className="media-lightbox-content" onClick={(e) => e.stopPropagation()} controls autoPlay />
          )}
        </div>
      )}
    </div>
  );
}
