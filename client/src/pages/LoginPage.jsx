import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      await doLogin({ login, password });
      toast.success('Đăng nhập thành công!');
      navigate('/feed');
    } catch (err) {
      if (Array.isArray(err.response?.data)) {
        const msgs = err.response.data.map(d => Object.values(d)[0]).join(', ');
        toast.error(msgs);
      } else {
        toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    toast.success('Đã gửi link đặt lại mật khẩu đến ' + forgotEmail);
    setShowForgot(false);
    setForgotEmail('');
  };

  return (
    <div className="login-page-old">
      <div className="login-container-old">
        <div className="logo-big">Gummy</div>

        <div className="login-box-old">
          <form onSubmit={handleSubmit}>
            <input
              type="text" className="input"
              placeholder="Email hoặc tên đăng nhập"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoFocus
            />
            <input
              type="password" className="input"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>

            <a href="#" className="forgot" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>
              Quên mật khẩu?
            </a>

            <div className="line"></div>

            <Link to="/register" className="btn-new">
              Tạo Tài Khoản Gummy
            </Link>
          </form>
        </div>
      </div>

      {/* Popup quên mật khẩu */}
      {showForgot && (
        <div className="forgot-overlay" onClick={() => setShowForgot(false)}>
          <div className="forgot-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Quên Mật Khẩu</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 15 }}>
              Nhập email để nhận link đặt lại mật khẩu
            </p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email" className="input"
                placeholder="Nhập email của bạn"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-login">Gửi Link</button>
              <button type="button" className="btn-cancel-forgot"
                onClick={() => setShowForgot(false)}>Huỷ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
